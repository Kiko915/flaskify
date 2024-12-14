from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import requests
from datetime import datetime
import logging
from datetime import timezone
from sqlalchemy import or_
from models import Product, db
from flask import current_app

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_scheduler(app):
    scheduler = BackgroundScheduler()
    
    def update_discounts():
        try:
            with app.app_context():
                now = datetime.now(timezone.utc)
                logger.info(f"Running scheduled discount update at {now} (UTC)")
                
                # Check if there are any active or pending discounts
                has_discounts = Product.query.filter(
                    Product.discount_name.isnot(None),
                    or_(
                        Product.discount_end_date >= now,  # Active or future discounts
                        Product.discount_start_date >= now  # Pending discounts
                    )
                ).first() is not None
                
                if not has_discounts:
                    logger.info("No active or pending discounts found. Stopping scheduler.")
                    scheduler.shutdown()
                    return
                
                response = requests.post('http://localhost:5555/cron/update-discounts')
                
                if response.status_code == 200:
                    result = response.json()
                    logger.info(f"Discount update completed: {result}")
                    if result.get('discounts_expired', 0) > 0:
                        logger.info(f"Removed {result['discounts_expired']} expired discounts")
                else:
                    logger.error(f"Failed to update discounts: {response.text}")
                    
        except Exception as e:
            logger.error(f"Error in scheduled discount update: {str(e)}")

    # Run every 30 seconds
    scheduler.add_job(
        update_discounts,
        trigger=IntervalTrigger(seconds=30),
        id='update_discounts',
        name='Update product discounts',
        replace_existing=True
    )

    scheduler.start()
    logger.info("Discount scheduler started with 30-second interval") 