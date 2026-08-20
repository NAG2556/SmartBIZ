import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.core.database import Base, engine, SessionLocal
from app.models.models import User, Customer, Product, Bill, Payment, Transaction, Message, Campaign
from app.services.seed_service import seed_database_if_empty
from app.services.customer_service import lookup_customer_by_phone, calculate_customer_balance, get_customers
from app.services.analytics_service import get_dashboard_stats
from app.services.ai_agent_service import process_ai_command

def run_tests():
    print("[1/5] Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created successfully.")

    db = SessionLocal()
    try:
        print("[2/5] Seeding realistic SME business data...")
        seed_database_if_empty(db)
        print("✓ Database seeded successfully.")

        user = db.query(User).filter(User.email == "ravi@smartbiz.ai").first()
        assert user is not None, "Demo user not found"
        print(f"✓ Found user: {user.name} ({user.business_name})")

        print("[3/5] Testing Smart Customer Phone Lookup (Critical Feature)...")
        # Lookup Ravi Kumar by phone
        res = lookup_customer_by_phone(db, user.id, "9876543210")
        assert res.found == True, "Customer Ravi Kumar should be found by phone"
        assert res.customer.name == "Ravi Kumar", f"Expected Ravi Kumar, got {res.customer.name}"
        assert res.customer.outstanding_balance > 0, f"Expected positive balance, got {res.customer.outstanding_balance}"
        print(f"✓ Smart Lookup: Identified {res.customer.name} (ID: {res.customer.customer_serial_number}, Outstanding: {user.currency}{res.customer.outstanding_balance})")

        print("[4/5] Testing Dashboard Analytics & Calculations...")
        stats = get_dashboard_stats(db, user)
        print(f"✓ Dashboard Stats: Today's Sales = {stats.currency}{stats.today_sales}, Total Outstanding = {stats.currency}{stats.total_outstanding_credit}, Customers = {stats.total_customers}")

        print("[5/5] Testing AI Assistant Tool Calling...")
        # Query 1: Sales
        ai_resp1 = process_ai_command(db, user, "How much did I sell today?")
        assert len(ai_resp1.tools_executed) > 0, "AI should execute get_daily_sales tool"
        print(f"✓ AI Tool Execution 1: {ai_resp1.tools_executed[0].tool_name} -> Reply preview:\n{ai_resp1.reply[:120]}...\n")

        # Query 2: Outstanding debtors
        ai_resp2 = process_ai_command(db, user, "Who owes me more than 1000?")
        assert len(ai_resp2.tools_executed) > 0, "AI should execute get_outstanding_customers tool"
        print(f"✓ AI Tool Execution 2: {ai_resp2.tools_executed[0].tool_name} -> Found {len(ai_resp2.action_data)} debtors")

        # Action 3: Record payment
        ai_resp3 = process_ai_command(db, user, "Record that Ravi paid 500 in UPI")
        assert len(ai_resp3.tools_executed) > 0, "AI should execute record_payment tool"
        print(f"✓ AI Tool Execution 3: {ai_resp3.tools_executed[0].tool_name} -> Recorded payment. New balance: {ai_resp3.action_data['new_balance']}")

        print("\nALL BACKEND CORE TESTS PASSED WITH 100% SUCCESS! 🎉")
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
