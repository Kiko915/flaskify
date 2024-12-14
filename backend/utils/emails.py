from flask import render_template, current_app
from flask_mail import Message
from models import mail
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
import os


def send_welcome_email(user_email, user_name):
    msg = Message('Welcome to Flaskify!',
                  sender=current_app.config['MAIL_DEFAULT_SENDER'],
                  recipients=[user_email])
    msg.html = render_template('welcome_email.html', user_name=user_name)
    mail.send(msg)


def send_otp_email(email, otp):
    msg = Message('Your OTP Code', 
                 sender=current_app.config['MAIL_DEFAULT_SENDER'], 
                 recipients=[email])
    msg.html = render_template('signup_otp.html', otp_code=otp)
    mail.send(msg)


def send_password_reset_email(email, reset_url):
    msg = Message('Password Reset Request', 
                 sender=current_app.config['MAIL_DEFAULT_SENDER'], 
                 recipients=[email])
    msg.html = render_template('reset-password.html', reset_password_url=reset_url, user_email=email)
    mail.send(msg)


def send_seller_approval_email(email, user_name):
    msg = Message('Your Seller Account is Approved!',
                  sender=current_app.config['MAIL_DEFAULT_SENDER'],
                  recipients=[email])
    msg.html = render_template('seller-approval-notification.html', user_name=user_name)
    mail.send(msg)


def send_seller_rejection_email(email, user_name, rejection_reason, admin_notes):
    msg = Message('Your Seller Account is Rejected', 
                  sender=current_app.config['MAIL_DEFAULT_SENDER'],
                  recipients=[email])
    msg.html = render_template('seller-rejection-notification.html', 
                             user_name=user_name,
                             rejection_reason=rejection_reason,
                             admin_notes=admin_notes)
    mail.send(msg)


def send_seller_suspension_email(email, user_name, remarks, violation_type):
    violation_types = {
        'counterfeit': 'Selling Counterfeit Products',
        'misrepresentation': 'Product Misrepresentation',
        'shipping': 'Shipping Violations',
        'customer_service': 'Poor Customer Service',
        'policy': 'Policy Violations',
        'fraud': 'Fraudulent Activity',
        'other': 'Other Violations'
    }
    
    formatted_violation = violation_types.get(violation_type, 'Policy Violation')
    
    msg = Message('Your Seller Account has been Suspended', 
                  sender=current_app.config['MAIL_DEFAULT_SENDER'],
                  recipients=[email])
    msg.html = render_template('seller-suspension-notification.html',
                             user_name=user_name,
                             violation_type=formatted_violation,
                             remarks=remarks)
    mail.send(msg)


def send_newsletter_welcome_email(email):
    msg = Message('Welcome to Flaskify Newsletter!',
                  sender=current_app.config['MAIL_DEFAULT_SENDER'],
                  recipients=[email])
    msg.html = render_template('newsletter_welcome.html', email=email)
    mail.send(msg)


def generate_and_send_invoice(order, user_email):
    """Generate PDF invoice and send it to the user"""
    try:
        # Get payment method details
        payment_method = order.payment_method
        payment_info = "Cash on Delivery"
        if payment_method == 'credit_card':
            payment_info = "Credit Card"
        elif payment_method == 'paypal':
            payment_info = "PayPal"
        
        # Create PDF
        invoice_path = f'invoices/order_{order.order_uuid}.pdf'
        os.makedirs('invoices', exist_ok=True)
        
        doc = SimpleDocTemplate(
            invoice_path,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        # Get styles
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(
            name='Center',
            parent=styles['Heading1'],
            alignment=1,
            spaceAfter=30
        ))
        
        # Create story (content)
        story = []
        
        # Add header
        story.append(Paragraph("Flaskify", styles['Center']))
        story.append(Paragraph("Order Invoice", styles['Center']))
        story.append(Spacer(1, 12))
        
        # Add order details
        story.append(Paragraph(f"Order ID: {order.order_uuid}", styles['Normal']))
        story.append(Paragraph(f"Date: {order.created_at.strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
        story.append(Paragraph(f"Payment Method: {payment_info}", styles['Normal']))
        story.append(Paragraph(f"Transaction ID: {order.transaction_id}", styles['Normal']))
        story.append(Spacer(1, 12))
        
        # Add shipping address
        story.append(Paragraph("Shipping Address:", styles['Heading2']))
        for key, value in order.shipping_address.items():
            story.append(Paragraph(f"{key.replace('_', ' ').title()}: {value}", styles['Normal']))
        story.append(Spacer(1, 12))
        
        # Add order items
        story.append(Paragraph("Order Items:", styles['Heading2']))
        
        # Create items table
        table_data = [['Product', 'Quantity', 'Unit Price', 'Subtotal']]
        for item in order.items:
            table_data.append([
                item.product.name,
                str(item.quantity),
                f"₱{float(item.unit_price):.2f}",
                f"₱{float(item.subtotal):.2f}"
            ])
        
        # Add totals
        table_data.extend([
            ['', '', 'Subtotal:', f"₱{float(order.subtotal):.2f}"],
            ['', '', 'Shipping:', f"₱{float(order.shipping_fee):.2f}"],
            ['', '', 'Total:', f"₱{float(order.total):.2f}"]
        ])
        
        # Create table
        table = Table(table_data, colWidths=[4*inch, inch, 1.2*inch, 1.2*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.Color(250/255, 204/255, 21/255)),  # Flaskify yellow
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.Color(249/255, 250/255, 251/255)),  # Light gray
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 12),
            ('ALIGN', (-2, -3), (-1, -1), 'RIGHT'),
            ('TEXTCOLOR', (-2, -3), (-2, -1), colors.black),
            ('FONTNAME', (-2, -3), (-2, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(table)
        
        # Build PDF
        doc.build(story)
        
        # Send email with PDF attachment
        msg = Message(
            'Your Flaskify Order Invoice',
            sender=current_app.config['MAIL_DEFAULT_SENDER'],
            recipients=[user_email]
        )
        
        msg.html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #facc15;
                    text-align: center;
                    padding: 20px;
                    border-radius: 8px 8px 0 0;
                }}
                .header img {{
                    height: 40px;
                    margin-bottom: 10px;
                }}
                .content {{
                    background-color: #fff;
                    padding: 30px;
                    border: 1px solid #eee;
                    border-radius: 0 0 8px 8px;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    color: #666;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="https://res.cloudinary.com/da3b5g9ad/image/upload/f_auto,q_auto/flaskify-primary_szhmav" alt="Flaskify Logo">
                    <h1 style="color: #000; margin: 0;">Order Invoice</h1>
                </div>
                <div class="content">
                    <p>Dear Valued Customer,</p>
                    <p>Thank you for shopping with Flaskify! Please find your order invoice attached to this email.</p>
                    <p>Order Details:</p>
                    <ul>
                        <li>Order ID: {order.order_uuid}</li>
                        <li>Order Date: {order.created_at.strftime('%Y-%m-%d %H:%M:%S')}</li>
                        <li>Total Amount: ₱{float(order.total):.2f}</li>
                    </ul>
                    <p>If you have any questions about your invoice, please don't hesitate to contact our customer service team.</p>
                    <div class="footer">
                        <p>© 2023 Flaskify. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        with current_app.open_resource(invoice_path) as fp:
            msg.attach(
                f'order_{order.order_uuid}.pdf',
                'application/pdf',
                fp.read()
            )
        
        mail.send(msg)
        print(f"Invoice sent successfully to {user_email}")
        
    except Exception as e:
        print(f'Error generating/sending invoice: {str(e)}')
        raise


def send_order_confirmation(order, user_email):
    """Send order confirmation email"""
    try:
        # Get payment method details
        payment_method = order.payment_method
        payment_info = "Cash on Delivery"
        if payment_method == 'credit_card':
            payment_info = "Credit Card"
        elif payment_method == 'paypal':
            payment_info = "PayPal"
        
        msg = Message(
            'Your Flaskify Order Confirmation',
            sender=current_app.config['MAIL_DEFAULT_SENDER'],
            recipients=[user_email]
        )
        
        msg.html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #facc15;
                    text-align: center;
                    padding: 20px;
                    border-radius: 8px 8px 0 0;
                }}
                .header img {{
                    height: 40px;
                    margin-bottom: 10px;
                }}
                .content {{
                    background-color: #fff;
                    padding: 30px;
                    border: 1px solid #eee;
                    border-radius: 0 0 8px 8px;
                }}
                .order-details {{
                    background-color: #f9fafb;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }}
                .order-table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }}
                .order-table th {{
                    background-color: #f3f4f6;
                    padding: 12px;
                    text-align: left;
                    border-bottom: 2px solid #e5e7eb;
                }}
                .order-table td {{
                    padding: 12px;
                    border-bottom: 1px solid #e5e7eb;
                }}
                .total-row {{
                    font-weight: bold;
                    background-color: #f9fafb;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    color: #666;
                }}
                .button {{
                    display: inline-block;
                    background-color: #facc15;
                    color: #000;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 6px;
                    margin-top: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="https://res.cloudinary.com/da3b5g9ad/image/upload/f_auto,q_auto/flaskify-primary_szhmav" alt="Flaskify Logo">
                    <h1 style="color: #000; margin: 0;">Order Confirmation</h1>
                </div>
                <div class="content">
                    <h2>Thank you for your order!</h2>
                    <p>Your order has been confirmed and is being processed.</p>
                    
                    <div class="order-details">
                        <h3>Order Details</h3>
                        <p><strong>Order ID:</strong> {order.order_uuid}</p>
                        <p><strong>Order Date:</strong> {order.created_at.strftime('%Y-%m-%d %H:%M:%S')}</p>
                        <p><strong>Payment Method:</strong> {payment_info}</p>
                    </div>

                    <div class="order-details">
                        <h3>Shipping Address</h3>
                        <p>{order.shipping_address.get('complete_address')}</p>
                        <p>{order.shipping_address.get('city')}, {order.shipping_address.get('province')}</p>
                        <p>Contact: {order.shipping_address.get('phone_number')}</p>
                    </div>

                    <h3>Order Items</h3>
                    <table class="order-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {''.join(f"""
                            <tr>
                                <td>{item.product.name}</td>
                                <td>{item.quantity}</td>
                                <td>₱{float(item.subtotal):.2f}</td>
                            </tr>
                            """ for item in order.items)}
                            <tr class="total-row">
                                <td colspan="2">Subtotal:</td>
                                <td>₱{float(order.subtotal):.2f}</td>
                            </tr>
                            <tr class="total-row">
                                <td colspan="2">Shipping:</td>
                                <td>₱{float(order.shipping_fee):.2f}</td>
                            </tr>
                            <tr class="total-row">
                                <td colspan="2">Total:</td>
                                <td>₱{float(order.total):.2f}</td>
                            </tr>
                        </tbody>
                    </table>

                    <p>We'll send you another email when your order ships.</p>
                    
                    <div style="text-align: center;">
                        <a href="http://localhost:5173/user/purchases" class="button">View Order Details</a>
                    </div>

                    <div class="footer">
                        <p>If you have any questions about your order, please contact our customer service.</p>
                        <p>© 2023 Flaskify. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        mail.send(msg)
        print(f"Order confirmation sent successfully to {user_email}")
        
    except Exception as e:
        print(f'Error sending order confirmation: {str(e)}')
        raise


def send_order_cancellation_email(order, user_email):
    """Send order cancellation email to customer"""
    try:
        msg = Message(
            'Your Flaskify Order Has Been Cancelled',
            sender=current_app.config['MAIL_DEFAULT_SENDER'],
            recipients=[user_email]
        )
        
        # Create item details with variations
        item_details = []
        for item in order.items:
            item_detail = f"""
            <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 4px;">
                <p style="margin: 0 0 5px 0;"><strong>{item.product.name}</strong></p>
            """
            if item.variation_uuid and item.selected_option:
                item_detail += f"""
                <p style="margin: 0 0 5px 0; color: #4b5563;">
                    <strong>Variation:</strong> {item.selected_option['name']}: {item.selected_option['value']}
                </p>
                """
                if item.selected_option.get('sku'):
                    item_detail += f"""
                    <p style="margin: 0 0 5px 0; color: #4b5563;">
                        <strong>SKU:</strong> {item.selected_option['sku']}
                    </p>
                    """
            
            item_detail += f"""
                <p style="margin: 0 0 5px 0; color: #4b5563;">
                    <strong>Quantity:</strong> {item.quantity}
                </p>
                <p style="margin: 0; color: #4b5563;">
                    <strong>Price:</strong> ₱{float(item.subtotal):.2f}
                </p>
            </div>
            """
            item_details.append(item_detail)
        
        msg.html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #facc15;
                    text-align: center;
                    padding: 20px;
                    border-radius: 8px 8px 0 0;
                }}
                .header img {{
                    height: 40px;
                    margin-bottom: 10px;
                }}
                .content {{
                    background-color: #fff;
                    padding: 30px;
                    border: 1px solid #eee;
                    border-radius: 0 0 8px 8px;
                }}
                .order-details {{
                    background-color: #f9fafb;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    color: #666;
                }}
                .button {{
                    display: inline-block;
                    background-color: #facc15;
                    color: #000;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 6px;
                    margin-top: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="https://res.cloudinary.com/da3b5g9ad/image/upload/f_auto,q_auto/flaskify-primary_szhmav" alt="Flaskify Logo">
                    <h1 style="color: #000; margin: 0;">Order Cancellation Notice</h1>
                </div>
                <div class="content">
                    <h2>Order Cancellation Notice</h2>
                    <p>We regret to inform you that your order has been cancelled by the seller.</p>
                    
                    <div class="order-details">
                        <h3>Order Details</h3>
                        <p><strong>Order ID:</strong> {order.order_uuid}</p>
                        <p><strong>Order Date:</strong> {order.created_at.strftime('%Y-%m-%d %H:%M:%S')}</p>
                        <p><strong>Cancellation Reason:</strong> {order.cancellation_reason}</p>
                    </div>

                    <div class="order-details">
                        <h3>Cancelled Items</h3>
                        {''.join(item_details)}
                    </div>

                    <p>If you have any questions about this cancellation, please don't hesitate to contact our customer service.</p>
                    
                    <div style="text-align: center;">
                        <a href="http://localhost:5173/user/purchases" class="button">View Order Details</a>
                    </div>

                    <div class="footer">
                        <p>Thank you for your understanding.</p>
                        <p>© 2023 Flaskify. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        mail.send(msg)
        print(f"Order cancellation email sent successfully to {user_email}")
        
    except Exception as e:
        print(f'Error sending order cancellation email: {str(e)}')
        raise