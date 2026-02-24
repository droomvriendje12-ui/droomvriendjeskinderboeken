-- =============================================
-- EMAIL TEMPLATES TABLE - Supabase Migration
-- Voer uit in Supabase SQL Editor
-- =============================================

-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'marketing',
  variables JSONB DEFAULT '[]',
  cart_link VARCHAR(1000),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(active);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at 
  BEFORE UPDATE ON email_templates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_email_templates_updated_at();

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role has full access to email_templates" 
  ON email_templates FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Insert default "Familie" template
INSERT INTO email_templates (name, subject, content, description, category, variables, cart_link, active) VALUES 
(
  'Familie Campagne',
  'Beste {{firstname}}, het cadeau waar de hele familie blij van wordt 💝',
  '<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { text-align: center; padding: 20px; background: linear-gradient(135deg, #8B7355, #6d5a45); }
        .header img { height: 60px; }
        .content { padding: 30px; background: #fff; }
        h1 { color: #8B7355; font-size: 24px; }
        h2 { color: #8B7355; font-size: 20px; }
        .benefits-box { background: #f9f5f0; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .benefits-box ul { padding-left: 20px; }
        .benefits-box li { margin: 10px 0; }
        .product-grid { display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0; }
        .product-card { flex: 1; min-width: 120px; text-align: center; padding: 15px; background: #f9f5f0; border-radius: 10px; }
        .product-card img { width: 100%; max-width: 150px; border-radius: 8px; }
        .cta-button { display: block; text-align: center; background: #8B7355; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 18px; margin: 30px auto; max-width: 300px; }
        .cta-button:hover { background: #6d5a45; }
        .footer { text-align: center; padding: 20px; background: #f5f5f5; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <img src="/email-assets/logo.jpg" alt="Droomvriendjes">
    </div>
    <div class="content">
        <h1>Beste {{firstname}},<br><br>het cadeau waar de hele familie blij van wordt 💝</h1>
        
        <p>Volgende week alweer een verjaardag? Of ben je op zoek naar een origineel cadeau voor oma, je nichtje, of je zus?</p>
        
        <p><strong>Stop met zoeken - wij hebben dé oplossing gevonden.</strong></p>

        <div class="benefits-box">
            <h2>Waarom families massaal kiezen voor Droomvriendjes:</h2>
            <ul>
                <li><strong>Voor jong én oud</strong> - Van kleinkind (3+) tot oma (93+)</li>
                <li><strong>Betekenisvol cadeau</strong> - Laat zien dat je om iemands welzijn geeft</li>
                <li><strong>Praktisch én leuk</strong> - Niet zomaar een stofvanger</li>
                <li><strong>Kwaliteit die blijft</strong> - Jarenlang plezier</li>
            </ul>
        </div>

        <h2>🎁 Onze populairste vriendjes:</h2>
        <div class="product-grid">
            <div class="product-card">
                <img src="/email-assets/schaap.jpg" alt="Schaapje">
                <p><strong>Schaapje Sophie</strong></p>
            </div>
            <div class="product-card">
                <img src="/email-assets/panda.jpg" alt="Panda">
                <p><strong>Panda Peter</strong></p>
            </div>
            <div class="product-card">
                <img src="/email-assets/dino.jpg" alt="Dino">
                <p><strong>Dino Danny</strong></p>
            </div>
        </div>

        <a href="{{cart_link}}" class="cta-button">Bestel voor mijn familie →</a>

        <p style="text-align: center; color: #999; font-size: 14px;">
            Gebruik code <strong>{{discount_code}}</strong> voor {{discount_percentage}} korting!
        </p>
    </div>
    <div class="footer">
        <p>© 2024 Droomvriendjes | <a href="{{unsubscribe_link}}">Uitschrijven</a></p>
    </div>
</body>
</html>',
  'Familie campagne email template met product showcase en winkelwagen link',
  'marketing',
  '["firstname", "cart_link", "discount_code", "discount_percentage", "unsubscribe_link"]',
  'https://droomvriendjes.nl/checkout?bundle=family&code=FAMILIE20',
  true
)
ON CONFLICT DO NOTHING;

-- Verify
SELECT id, name, category, active, created_at FROM email_templates;
