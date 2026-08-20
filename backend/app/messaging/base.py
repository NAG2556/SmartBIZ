"""
base.py — Abstract Messaging Provider Interface
All communication providers (WhatsApp, SMS, Email) must implement this.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional
from enum import Enum


class MessageStatus(str, Enum):
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


@dataclass
class ProviderSendResult:
    """Result returned by every provider after attempting to send a message."""
    success: bool
    status: MessageStatus
    provider_message_id: Optional[str] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    raw_response: Optional[dict] = field(default_factory=dict)


class MessagingProvider(ABC):
    """
    Abstract base class for all messaging providers.
    Never fake delivery — every implementation must call the real provider API
    and return the actual result.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Human-readable provider identifier, e.g. 'meta_whatsapp'"""

    @property
    @abstractmethod
    def is_configured(self) -> bool:
        """Returns True only if real credentials are present and valid to use."""

    @abstractmethod
    def send_message(
        self,
        recipient_phone: str,
        message_content: str,
        message_type: str = "CUSTOM",
        template_name: Optional[str] = None,
        template_params: Optional[list] = None,
    ) -> ProviderSendResult:
        """
        Send a message to the recipient.
        Must call the real provider API.
        Must return real status — never invent success.
        """

    def get_message_status(self, provider_message_id: str) -> Optional[MessageStatus]:
        """
        Poll the provider for delivery status.
        Optional — not all providers support polling.
        Returns None if not supported.
        """
        return None
