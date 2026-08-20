"""
sms_provider.py — Generic SMS Provider Interface

Placeholder for a future SMS provider (Msg91, TextLocal, etc).
Currently returns NOT_CONFIGURED when no provider is set up.
Never fakes successful delivery.
"""
from typing import Optional
from app.messaging.base import MessagingProvider, ProviderSendResult, MessageStatus


class GenericSMSProvider(MessagingProvider):
    """
    Generic SMS provider stub.
    Returns NOT_CONFIGURED until a real SMS provider is integrated.
    """

    @property
    def provider_name(self) -> str:
        return "sms_generic"

    @property
    def is_configured(self) -> bool:
        # No SMS provider configured yet
        return False

    def send_message(
        self,
        recipient_phone: str,
        message_content: str,
        message_type: str = "CUSTOM",
        template_name: Optional[str] = None,
        template_params: Optional[list] = None,
    ) -> ProviderSendResult:
        return ProviderSendResult(
            success=False,
            status=MessageStatus.FAILED,
            error_code="SMS_NOT_CONFIGURED",
            error_message=(
                "SMS provider is not configured. "
                "Please connect an SMS provider in Business Settings to send real SMS messages."
            ),
        )


# Singleton
sms_provider = GenericSMSProvider()
