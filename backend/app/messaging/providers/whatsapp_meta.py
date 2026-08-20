"""
whatsapp_meta.py — Meta WhatsApp Cloud API Provider

Uses environment variables:
    META_WHATSAPP_ACCESS_TOKEN
    META_WHATSAPP_PHONE_NUMBER_ID
    META_WHATSAPP_BUSINESS_ACCOUNT_ID
    META_WHATSAPP_API_VERSION   (default: v19.0)

Never exposes credentials to frontend.
Returns real provider status — never fakes delivery.
"""
import requests
from typing import Optional
from app.messaging.base import MessagingProvider, ProviderSendResult, MessageStatus
from app.core.config import settings


def _clean_phone(phone: str, default_cc: str = "+91") -> str:
    cleaned = phone.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    if cleaned.startswith("+"):
        return cleaned.lstrip("+")
    if cleaned.startswith("0"):
        cleaned = cleaned[1:]
    return default_cc.lstrip("+") + cleaned


class MetaWhatsAppProvider(MessagingProvider):
    """
    Official Meta WhatsApp Cloud API provider.
    Live mode: credentials present → real API call.
    Demo mode: credentials missing → DEMO_PENDING status, no fake delivery.
    """

    @property
    def provider_name(self) -> str:
        return "meta_whatsapp"

    @property
    def is_configured(self) -> bool:
        return bool(
            settings.META_WHATSAPP_ACCESS_TOKEN
            and settings.META_WHATSAPP_PHONE_NUMBER_ID
        )

    def send_message(
        self,
        recipient_phone: str,
        message_content: str,
        message_type: str = "CUSTOM",
        template_name: Optional[str] = None,
        template_params: Optional[list] = None,
    ) -> ProviderSendResult:
        if not self.is_configured:
            # Demo Mode — do NOT claim real delivery
            return ProviderSendResult(
                success=False,
                status=MessageStatus.PENDING,
                provider_message_id=None,
                error_code="DEMO_MODE",
                error_message=(
                    "WhatsApp is not configured. "
                    "Add META_WHATSAPP_ACCESS_TOKEN and META_WHATSAPP_PHONE_NUMBER_ID "
                    "to send real messages. This is a demo simulation only."
                ),
            )

        api_version = getattr(settings, "META_WHATSAPP_API_VERSION", "v19.0")
        phone_number_id = settings.META_WHATSAPP_PHONE_NUMBER_ID
        access_token = settings.META_WHATSAPP_ACCESS_TOKEN
        to_number = _clean_phone(recipient_phone)

        url = f"https://graph.facebook.com/{api_version}/{phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        # Build payload
        if template_name:
            # Template message (required for marketing/utility outside 24h window)
            components = []
            if template_params:
                components = [
                    {
                        "type": "body",
                        "parameters": [{"type": "text", "text": p} for p in template_params],
                    }
                ]
            payload = {
                "messaging_product": "whatsapp",
                "to": to_number,
                "type": "template",
                "template": {
                    "name": template_name,
                    "language": {"code": "en"},
                    "components": components,
                },
            }
        else:
            # Free-form text (only valid within 24h customer-initiated window)
            payload = {
                "messaging_product": "whatsapp",
                "to": to_number,
                "type": "text",
                "text": {"preview_url": False, "body": message_content},
            }

        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=10)
            resp_data = resp.json()

            if resp.status_code in (200, 201):
                wam_id = None
                if "messages" in resp_data and resp_data["messages"]:
                    wam_id = resp_data["messages"][0].get("id")
                return ProviderSendResult(
                    success=True,
                    status=MessageStatus.SENT,
                    provider_message_id=wam_id,
                    raw_response=resp_data,
                )
            else:
                error = resp_data.get("error", {})
                return ProviderSendResult(
                    success=False,
                    status=MessageStatus.FAILED,
                    error_code=str(error.get("code", resp.status_code)),
                    error_message=error.get("message", resp.text),
                    raw_response=resp_data,
                )
        except requests.exceptions.Timeout:
            return ProviderSendResult(
                success=False,
                status=MessageStatus.FAILED,
                error_code="TIMEOUT",
                error_message="WhatsApp API request timed out.",
            )
        except requests.exceptions.ConnectionError as e:
            return ProviderSendResult(
                success=False,
                status=MessageStatus.FAILED,
                error_code="CONNECTION_ERROR",
                error_message=f"Cannot reach WhatsApp API: {str(e)}",
            )
        except Exception as e:
            return ProviderSendResult(
                success=False,
                status=MessageStatus.FAILED,
                error_code="UNKNOWN_ERROR",
                error_message=str(e),
            )

    def verify_webhook_token(self, token: str) -> bool:
        """Verify Meta webhook challenge token."""
        return token == getattr(settings, "META_WHATSAPP_WEBHOOK_VERIFY_TOKEN", "")

    def parse_webhook_event(self, payload: dict) -> Optional[dict]:
        """
        Parse a Meta WhatsApp webhook event.
        Returns dict with {provider_message_id, status} or None.
        Status mapping:
            sent      → SENT
            delivered → DELIVERED
            read      → DELIVERED
            failed    → FAILED
        """
        status_map = {
            "sent": MessageStatus.SENT,
            "delivered": MessageStatus.DELIVERED,
            "read": MessageStatus.DELIVERED,
            "failed": MessageStatus.FAILED,
        }
        try:
            entry = payload.get("entry", [{}])[0]
            changes = entry.get("changes", [{}])[0]
            value = changes.get("value", {})
            statuses = value.get("statuses", [])
            if statuses:
                s = statuses[0]
                wam_id = s.get("id")
                raw_status = s.get("status", "").lower()
                mapped = status_map.get(raw_status, MessageStatus.PENDING)
                error_info = s.get("errors", [{}])[0] if s.get("errors") else {}
                return {
                    "provider_message_id": wam_id,
                    "status": mapped,
                    "error_code": str(error_info.get("code", "")) if error_info else None,
                    "error_message": error_info.get("title") if error_info else None,
                }
        except Exception:
            pass
        return None


# Singleton instance
meta_whatsapp = MetaWhatsAppProvider()
