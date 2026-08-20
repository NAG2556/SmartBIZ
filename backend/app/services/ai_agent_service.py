import re
import json
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.config import settings
from app.models.models import User, Customer, Product, Bill, Payment, Transaction, Message
from app.schemas.schemas import AIChatResponse, AIToolExecuted, BillCreate, BillItemCreate, PaymentCreate
from app.services.customer_service import calculate_customer_balance, get_customers, lookup_customer_by_phone, enrich_customer_out
from app.services.billing_service import create_bill
from app.services.payment_service import record_customer_payment, get_customer_ledger
from app.services.analytics_service import get_dashboard_stats
from app.services.twilio_service import send_message, build_reminder_message

# --- REGISTERED BACKEND TOOLS ---

def tool_get_daily_sales(db: Session, user: User, **kwargs) -> Dict[str, Any]:
    stats = get_dashboard_stats(db, user)
    return {
        "today_sales": stats.today_sales,
        "today_collection": stats.today_collection,
        "today_credit_generated": stats.today_credit,
        "total_outstanding_credit": stats.total_outstanding_credit,
        "currency": stats.currency
    }

def tool_get_outstanding_customers(db: Session, user: User, min_amount: float = 0.0, **kwargs) -> List[Dict[str, Any]]:
    customers = get_customers(db, user.id, only_outstanding=True)
    results = []
    for c in customers:
        if c.outstanding_balance >= min_amount:
            results.append({
                "id": c.id,
                "name": c.name,
                "phone": c.phone,
                "serial_number": c.customer_serial_number,
                "outstanding_balance": c.outstanding_balance
            })
    results.sort(key=lambda x: x["outstanding_balance"], reverse=True)
    return results

def tool_find_customer(db: Session, user: User, query: str, **kwargs) -> Optional[Dict[str, Any]]:
    customers = get_customers(db, user.id, search=query)
    if not customers:
        return None
    c = customers[0]
    return {
        "id": c.id,
        "name": c.name,
        "phone": c.phone,
        "serial_number": c.customer_serial_number,
        "outstanding_balance": c.outstanding_balance,
        "total_purchases": c.total_purchases,
        "bills_count": c.bills_count
    }

def tool_get_customer_transactions(db: Session, user: User, customer_query: str, **kwargs) -> Dict[str, Any]:
    cust_data = tool_find_customer(db, user, query=customer_query)
    if not cust_data:
        return {"error": f"Customer '{customer_query}' not found"}
    
    ledger = get_customer_ledger(db, user, cust_data["id"])
    return {
        "customer": cust_data,
        "current_balance": ledger.current_outstanding_balance,
        "total_purchases": ledger.total_purchases,
        "total_payments": ledger.total_payments,
        "recent_transactions": [
            {
                "date": t.transaction_date.strftime("%d %b %Y"),
                "type": t.transaction_type,
                "amount": t.amount,
                "debit": t.debit,
                "credit": t.credit,
                "running_balance": t.running_balance,
                "description": t.description
            } for t in ledger.transactions[:5]
        ]
    }

def tool_record_payment(db: Session, user: User, customer_query: str, amount: float, payment_method: str = "Cash", **kwargs) -> Dict[str, Any]:
    cust_data = tool_find_customer(db, user, query=customer_query)
    if not cust_data:
        return {"error": f"Customer '{customer_query}' not found. Please verify the name or phone number."}

    pay_data = PaymentCreate(
        customer_id=cust_data["id"],
        amount=amount,
        payment_method=payment_method,
        notes=f"Recorded via SmartBiz AI Assistant"
    )
    result = record_customer_payment(db, user, pay_data)
    return {
        "success": True,
        "customer_name": result.customer_name,
        "customer_phone": result.customer_phone,
        "amount_paid": result.amount,
        "payment_method": result.payment_method,
        "previous_balance": result.previous_balance,
        "new_balance": result.new_balance,
        "currency": user.currency
    }

def tool_create_quick_bill(db: Session, user: User, customer_query: str, total_amount: float, amount_paid: float = 0.0, description: str = "General Purchase", **kwargs) -> Dict[str, Any]:
    cust_data = tool_find_customer(db, user, query=customer_query)
    if not cust_data:
        return {"error": f"Customer '{customer_query}' not found"}

    item = BillItemCreate(
        product_name=description,
        unit="item",
        quantity=1.0,
        unit_price=total_amount
    )
    bill_data = BillCreate(
        customer_id=cust_data["id"],
        items=[item],
        discount_amount=0.0,
        amount_paid=amount_paid,
        payment_method="Cash" if amount_paid > 0 else "Unpaid",
        notes="Generated via AI Assistant"
    )
    bill_out = create_bill(db, user, bill_data)
    return {
        "success": True,
        "bill_number": bill_out.bill_number,
        "customer_name": bill_out.customer_name,
        "total_amount": bill_out.total_amount,
        "amount_paid": bill_out.amount_paid,
        "credit_amount": bill_out.credit_amount,
        "new_outstanding_balance": bill_out.new_outstanding_balance,
        "currency": user.currency
    }

def tool_get_product_details(db: Session, user: User, product_name: str, **kwargs) -> Dict[str, Any]:
    prod = db.query(Product).filter(
        Product.user_id == user.id,
        Product.name.ilike(f"%{product_name.strip()}%"),
        Product.is_active == True
    ).first()
    if not prod:
        return {"error": f"Product '{product_name}' not found in catalog"}
    return {
        "id": prod.id,
        "name": prod.name,
        "category": prod.category,
        "selling_price": prod.selling_price,
        "stock_quantity": prod.stock_quantity,
        "unit": prod.unit,
        "is_service": prod.is_service,
        "currency": user.currency
    }

def tool_send_reminder(db: Session, user: User, customer_query: str, **kwargs) -> Dict[str, Any]:
    cust_data = tool_find_customer(db, user, query=customer_query)
    if not cust_data:
        return {"error": f"Customer '{customer_query}' not found"}

    balance = cust_data["outstanding_balance"]
    if balance <= 0:
        return {"error": f"{cust_data['name']} has no outstanding balance ({user.currency}0.00)."}

    msg_body = build_reminder_message(
        business_name=user.business_name,
        customer_name=cust_data["name"],
        outstanding_amount=balance,
        currency=user.currency
    )
    msg = send_message(
        db=db,
        user=user,
        recipient_phone=cust_data["phone"],
        message_content=msg_body,
        channel="WHATSAPP",
        message_type="REMINDER",
        customer_id=cust_data["id"],
        recipient_name=cust_data["name"]
    )
    return {
        "success": True,
        "customer_name": cust_data["name"],
        "phone": cust_data["phone"],
        "balance": balance,
        "channel": "WHATSAPP",
        "message_id": msg.id,
        "currency": user.currency
    }


# --- AI INTENT PARSER & EXECUTION ENGINE ---

def process_ai_command(db: Session, user: User, message_text: str) -> AIChatResponse:
    text = message_text.strip()
    lower = text.lower()
    executed_tools: List[AIToolExecuted] = []

    # 1. SALES / COLLECTION QUERY
    if any(q in lower for q in ["how much did i sell", "today's sale", "today sales", "sales today", "today's collection", "how much collected"]):
        data = tool_get_daily_sales(db, user)
        executed_tools.append(AIToolExecuted(
            tool_name="get_daily_sales",
            tool_input={},
            tool_output=data
        ))
        reply = (
            f"📊 **Today's Business Summary** ({user.business_name}):\n\n"
            f"• **Today's Sales:** {data['currency']}{data['today_sales']:,.2f}\n"
            f"• **Today's Collection:** {data['currency']}{data['today_collection']:,.2f}\n"
            f"• **Credit Generated Today:** {data['currency']}{data['today_credit_generated']:,.2f}\n"
            f"• **Total Outstanding Customer Credit:** {data['currency']}{data['total_outstanding_credit']:,.2f}"
        )
        return AIChatResponse(reply=reply, tools_executed=executed_tools, action_type="SALES_SUMMARY", action_data=data)

    # 2. OUTSTANDING CREDIT / DEBTORS QUERY (e.g. "Who owes me more than 5000", "Who has pending balance", "Show outstanding customers")
    if any(q in lower for q in ["who owes", "owing", "outstanding", "pending payment", "pending credit", "debtors"]):
        # Extract number if present (e.g., > 5000)
        match_amount = re.search(r"(\d+[\d,]*)", lower)
        min_amt = 0.0
        if match_amount and "more than" in lower or ">" in lower or "above" in lower:
            min_amt = float(match_amount.group(1).replace(",", ""))

        data = tool_get_outstanding_customers(db, user, min_amount=min_amt)
        executed_tools.append(AIToolExecuted(
            tool_name="get_outstanding_customers",
            tool_input={"min_amount": min_amt},
            tool_output=data
        ))

        if not data:
            reply = f"✅ No customers found with outstanding balance" + (f" above {user.currency}{min_amt:,.2f}." if min_amt > 0 else ".")
        else:
            lines = [f"• **{c['name']}** ({c['serial_number']}): {user.currency}{c['outstanding_balance']:,.2f} (📞 {c['phone']})" for c in data]
            total_sum = sum(c['outstanding_balance'] for c in data)
            reply = (
                f"👥 **Customers with Outstanding Balance" + (f" > {user.currency}{min_amt:,.2f}" if min_amt > 0 else "") + f":**\n\n"
                + "\n".join(lines) +
                f"\n\n**Total Due:** {user.currency}{total_sum:,.2f}"
            )
        return AIChatResponse(reply=reply, tools_executed=executed_tools, action_type="OUTSTANDING_LIST", action_data=data)

    # 3. RECORD PAYMENT ACTION (e.g. "Record that Ravi paid 1000", "Ravi paid 500 in UPI", "Received 1000 from Anil")
    if any(q in lower for q in ["paid", "payed", "received", "record payment"]):
        # Extract amount
        match_amount = re.search(r"(\d+[\d,]*(?:\.\d{1,2})?)", lower)
        # Extract payment method if mentioned
        pay_method = "Cash"
        if "upi" in lower:
            pay_method = "UPI"
        elif "card" in lower:
            pay_method = "Card"
        elif "bank" in lower or "transfer" in lower:
            pay_method = "Bank Transfer"

        if match_amount:
            amount_val = float(match_amount.group(1).replace(",", ""))
            # Extract customer name/identifier
            # Clean string around 'paid', 'from', 'record that'
            cleaned_name = lower
            for token in ["record that", "record payment", "record", "received", "paid", "payed", "from", "for", "in upi", "in cash", "via upi", "via cash", "via card", "rupees", "rs", "₹", match_amount.group(1)]:
                cleaned_name = cleaned_name.replace(token, " ")
            cust_name = cleaned_name.strip()

            if cust_name:
                res = tool_record_payment(db, user, customer_query=cust_name, amount=amount_val, payment_method=pay_method)
                executed_tools.append(AIToolExecuted(
                    tool_name="record_payment",
                    tool_input={"customer": cust_name, "amount": amount_val, "method": pay_method},
                    tool_output=res
                ))
                if res.get("success"):
                    reply = (
                        f"✅ **Payment Successfully Recorded!**\n\n"
                        f"• **Customer:** {res['customer_name']} (📞 {res['customer_phone']})\n"
                        f"• **Amount Paid:** {res['currency']}{res['amount_paid']:,.2f} ({res['payment_method']})\n"
                        f"• **Previous Balance:** {res['currency']}{res['previous_balance']:,.2f}\n"
                        f"• **New Outstanding Balance:** {res['currency']}{res['new_balance']:,.2f}\n\n"
                        f"*Ledger and transaction history have been automatically updated.*"
                    )
                    return AIChatResponse(reply=reply, tools_executed=executed_tools, action_type="PAYMENT_RECORDED", action_data=res)
                else:
                    return AIChatResponse(reply=f"⚠️ {res.get('error')}", tools_executed=executed_tools)

    # 4. CREATE BILL ACTION (e.g. "Create a bill for Ravi for 1500 and he paid 1000", "Bill Suresh 2000 paid 500")
    if "create bill" in lower or "bill for" in lower or "create a bill" in lower:
        amounts = re.findall(r"(\d+[\d,]*(?:\.\d{1,2})?)", lower)
        if amounts:
            total_amt = float(amounts[0].replace(",", ""))
            paid_amt = float(amounts[1].replace(",", "")) if len(amounts) > 1 else 0.0
            
            cleaned_name = lower
            for token in ["create a bill for", "create bill for", "bill for", "and he paid", "he paid", "paid", "and paid", "rs", "₹", "rupees"] + amounts:
                cleaned_name = cleaned_name.replace(token, " ")
            cust_name = cleaned_name.strip()

            if cust_name:
                res = tool_create_quick_bill(db, user, customer_query=cust_name, total_amount=total_amt, amount_paid=paid_amt)
                executed_tools.append(AIToolExecuted(
                    tool_name="create_bill",
                    tool_input={"customer": cust_name, "total": total_amt, "paid": paid_amt},
                    tool_output=res
                ))
                if res.get("success"):
                    reply = (
                        f"🧾 **Invoice {res['bill_number']} Created Successfully!**\n\n"
                        f"• **Customer:** {res['customer_name']}\n"
                        f"• **Total Bill:** {res['currency']}{res['total_amount']:,.2f}\n"
                        f"• **Amount Paid:** {res['currency']}{res['amount_paid']:,.2f}\n"
                        f"• **Credit/Due Added:** {res['currency']}{res['credit_amount']:,.2f}\n"
                        f"• **New Outstanding Balance:** {res['currency']}{res['new_outstanding_balance']:,.2f}"
                    )
                    return AIChatResponse(reply=reply, tools_executed=executed_tools, action_type="BILL_CREATED", action_data=res)
                else:
                    return AIChatResponse(reply=f"⚠️ {res.get('error')}", tools_executed=executed_tools)

    # 5. CUSTOMER LEDGER / TRANSACTIONS QUERY (e.g. "Show Ravi's transactions", "Show ledger for Ravi", "Ravi balance")
    if any(q in lower for q in ["transaction", "transactions", "ledger", "history", "balance for", "how much does", "owes"]):
        cleaned_name = lower
        for token in ["show", "transactions", "transaction", "for", "ledger", "history", "of", "'s", "what is", "balance", "how much does", "owe"]:
            cleaned_name = cleaned_name.replace(token, " ")
        cust_name = cleaned_name.strip()
        if cust_name:
            res = tool_get_customer_transactions(db, user, customer_query=cust_name)
            executed_tools.append(AIToolExecuted(
                tool_name="get_customer_transactions",
                tool_input={"customer": cust_name},
                tool_output=res
            ))
            if "error" in res:
                return AIChatResponse(reply=f"⚠️ {res['error']}", tools_executed=executed_tools)
            
            cust = res["customer"]
            tx_lines = [f"• {t['date']}: {t['type']} | Debit: {user.currency}{t['debit']:,.2f} | Credit: {user.currency}{t['credit']:,.2f} | Bal: {user.currency}{t['running_balance']:,.2f}" for t in res["recent_transactions"]]
            reply = (
                f"👤 **Customer Profile: {cust['name']}** ({cust['serial_number']})\n"
                f"📞 Phone: {cust['phone']}\n"
                f"💰 **Current Outstanding Balance:** {user.currency}{res['current_balance']:,.2f}\n"
                f"🛒 Total Purchases: {user.currency}{res['total_purchases']:,.2f} | Total Payments: {user.currency}{res['total_payments']:,.2f}\n\n"
                f"**Recent Transactions:**\n" + ("\n".join(tx_lines) if tx_lines else "No transactions yet.")
            )
            return AIChatResponse(reply=reply, tools_executed=executed_tools, action_type="CUSTOMER_LEDGER", action_data=res)

    # 6. PRODUCT PRICE / STOCK QUERY (e.g. "Price of Rice", "Stock for Oil", "What is price of sugar")
    if any(q in lower for q in ["price of", "stock of", "cost of", "how much is", "product"]):
        cleaned_prod = lower
        for token in ["what is", "the", "price of", "stock of", "cost of", "how much is", "product"]:
            cleaned_prod = cleaned_prod.replace(token, " ")
        prod_name = cleaned_prod.strip()
        if prod_name:
            res = tool_get_product_details(db, user, product_name=prod_name)
            executed_tools.append(AIToolExecuted(
                tool_name="get_product_details",
                tool_input={"product": prod_name},
                tool_output=res
            ))
            if "error" in res:
                return AIChatResponse(reply=f"⚠️ {res['error']}", tools_executed=executed_tools)
            
            reply = (
                f"📦 **Product Info: {res['name']}**\n\n"
                f"• **Selling Price:** {res['currency']}{res['selling_price']:,.2f} per {res['unit']}\n"
                f"• **Current Stock:** {res['stock_quantity']} {res['unit']}\n"
                f"• **Category:** {res['category']}"
            )
            return AIChatResponse(reply=reply, tools_executed=executed_tools, action_type="PRODUCT_INFO", action_data=res)

    # 7. SEND REMINDER (e.g. "Send reminder to Ravi", "Remind Suresh about payment")
    if any(q in lower for q in ["send reminder to", "remind", "send payment reminder"]):
        cleaned_name = lower
        for token in ["send reminder to", "send payment reminder to", "remind", "about payment", "for payment"]:
            cleaned_name = cleaned_name.replace(token, " ")
        cust_name = cleaned_name.strip()
        if cust_name:
            res = tool_send_reminder(db, user, customer_query=cust_name)
            executed_tools.append(AIToolExecuted(
                tool_name="send_reminder",
                tool_input={"customer": cust_name},
                tool_output=res
            ))
            if "error" in res:
                return AIChatResponse(reply=f"⚠️ {res['error']}", tools_executed=executed_tools)
            
            reply = (
                f"📲 **Reminder Dispatched to {res['customer_name']}!**\n\n"
                f"• **Recipient:** {res['phone']}\n"
                f"• **Channel:** WhatsApp\n"
                f"• **Outstanding Balance Reminded:** {res['currency']}{res['balance']:,.2f}\n\n"
                f"*Logged in message history.*"
            )
            return AIChatResponse(reply=reply, tools_executed=executed_tools, action_type="REMINDER_SENT", action_data=res)

    # 8. DEFAULT HELPFUL FALLBACK WITH SMART SUGGESTIONS
    reply = (
        f"🤖 **Hello {user.name}! I am your SmartBiz AI Business Assistant.**\n\n"
        f"I can interact directly with your business records. Here are examples of commands you can try:\n\n"
        f"• *\"How much did I sell today?\"*\n"
        f"• *\"Who owes me more than ₹1,000?\"*\n"
        f"• *\"Show Ravi's transactions\"*\n"
        f"• *\"Record that Ravi paid ₹500 in UPI\"*\n"
        f"• *\"Create a bill for Anil for ₹1,200 and he paid ₹800\"*\n"
        f"• *\"What is the price of Rice?\"*\n"
        f"• *\"Send payment reminder to Suresh\"*"
    )
    return AIChatResponse(reply=reply, tools_executed=[], action_type="GENERAL_HELP")
