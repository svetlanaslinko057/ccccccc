"""
O10/O12: Bot Keyboards (Ukrainian)
"""
from aiogram.types import (
    ReplyKeyboardMarkup, 
    KeyboardButton, 
    InlineKeyboardMarkup, 
    InlineKeyboardButton
)


def main_menu():
    """Main reply keyboard menu"""
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📊 Операційна панель")],
            [KeyboardButton(text="📦 Замовлення"), KeyboardButton(text="🚚 Доставки")],
            [KeyboardButton(text="👤 CRM"), KeyboardButton(text="💰 Фінанси")],
            [KeyboardButton(text="📦 Майстер ТТН"), KeyboardButton(text="📣 Розсилка")],
            [KeyboardButton(text="📮 Повернення"), KeyboardButton(text="⚠️ Ризики")],
            [KeyboardButton(text="📈 Аналітика"), KeyboardButton(text="🛡️ Guard")],
            [KeyboardButton(text="🧯 Інциденти"), KeyboardButton(text="⚙️ Налаштування")]
        ],
        resize_keyboard=True
    )


def wizards_menu():
    """Inline keyboard for wizards"""
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📦 Майстер ТТН", callback_data="wiz:ttn:start")],
        [InlineKeyboardButton(text="📣 Майстер розсилки", callback_data="wiz:blast:start")],
        [InlineKeyboardButton(text="🧯 Інциденти", callback_data="wiz:incidents:start")],
    ])


def cancel_kb():
    """Cancel button"""
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="❌ Скасувати", callback_data="wiz:cancel")]
    ])


def back_cancel_kb():
    """Back and cancel buttons"""
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="⬅️ Назад", callback_data="wiz:back"),
            InlineKeyboardButton(text="❌ Скасувати", callback_data="wiz:cancel")
        ]
    ])


def confirm_kb(confirm_cb: str, cancel_cb: str = "wiz:cancel"):
    """Confirm/cancel keyboard"""
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Підтвердити", callback_data=confirm_cb)],
        [InlineKeyboardButton(text="❌ Скасувати", callback_data=cancel_cb)]
    ])


def ttn_confirm_kb(order_id: str):
    """TTN creation confirm keyboard"""
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Створити ТТН", callback_data=f"wiz:ttn:confirm:{order_id}")],
        [InlineKeyboardButton(text="❌ Скасувати", callback_data="wiz:cancel")]
    ])


def ttn_post_actions_kb(order_id: str, ttn: str):
    """Actions after TTN created"""
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="🖨 PDF етикетка", callback_data=f"wiz:ttn:pdf:{ttn}"),
            InlineKeyboardButton(text="🔄 Оновити статус", callback_data=f"wiz:ttn:refresh:{order_id}")
        ],
        [InlineKeyboardButton(text="📨 SMS клієнту", callback_data=f"wiz:ttn:sms:{order_id}")],
        [InlineKeyboardButton(text="🏠 Головне меню", callback_data="wiz:back")]
    ])


def segment_kb():
    """Segment selection for broadcast"""
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="⭐ VIP", callback_data="wiz:blast:seg:VIP"),
            InlineKeyboardButton(text="⚠️ RISK", callback_data="wiz:blast:seg:RISK"),
            InlineKeyboardButton(text="🆕 NEW", callback_data="wiz:blast:seg:NEW")
        ],
        [
            InlineKeyboardButton(text="✅ REGULAR", callback_data="wiz:blast:seg:REGULAR"),
            InlineKeyboardButton(text="🌍 УСІ", callback_data="wiz:blast:seg:ALL")
        ],
        [InlineKeyboardButton(text="❌ Скасувати", callback_data="wiz:cancel")]
    ])


def channel_kb():
    """Channel selection for broadcast"""
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="📨 SMS", callback_data="wiz:blast:ch:SMS"),
            InlineKeyboardButton(text="📧 Email", callback_data="wiz:blast:ch:EMAIL")
        ],
        [InlineKeyboardButton(text="❌ Скасувати", callback_data="wiz:cancel")]
    ])


def blast_confirm_kb():
    """Broadcast confirm keyboard"""
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Підтвердити розсилку", callback_data="wiz:blast:confirm")],
        [InlineKeyboardButton(text="❌ Скасувати", callback_data="wiz:cancel")]
    ])


def incident_actions_kb(kind: str, key: str):
    """Actions for incident"""
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="🔄 Оновити", callback_data=f"wiz:inc:refresh:{kind}:{key}"),
            InlineKeyboardButton(text="📨 SMS", callback_data=f"wiz:inc:sms:{kind}:{key}")
        ],
        [
            InlineKeyboardButton(text="📝 Нотатка", callback_data=f"wiz:inc:note:{kind}:{key}"),
            InlineKeyboardButton(text="🚫 Блок", callback_data=f"wiz:inc:block:{kind}:{key}")
        ],
        [
            InlineKeyboardButton(text="➡️ Далі", callback_data="wiz:inc:next"),
            InlineKeyboardButton(text="🏠 Меню", callback_data="wiz:back")
        ]
    ])


def settings_menu_kb():
    """Settings menu keyboard"""
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📊 Пороги алертів", callback_data="set:thresholds")],
        [InlineKeyboardButton(text="🔔 Типи сповіщень", callback_data="set:alerts")],
        [InlineKeyboardButton(text="🤖 Автоматизація", callback_data="set:automation")],
        [InlineKeyboardButton(text="🏠 Назад", callback_data="wiz:back")]
    ])
