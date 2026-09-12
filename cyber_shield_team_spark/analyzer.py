import re
from urllib.parse import urlparse

# Baseline authentic domains
AUTHENTIC_DOMAINS = {
    "sbi": {"domains": ["onlinesbi.sbi", "sbi.co.in"], "official_url": "https://onlinesbi.sbi"},
    "onlinesbi": {"domains": ["onlinesbi.sbi", "sbi.co.in"], "official_url": "https://onlinesbi.sbi"},
    "hdfc": {"domains": ["hdfcbank.com"], "official_url": "https://hdfcbank.com"},
    "hdfcbank": {"domains": ["hdfcbank.com"], "official_url": "https://hdfcbank.com"},
    "icici": {"domains": ["icicibank.com"], "official_url": "https://icicibank.com"},
    "icicibank": {"domains": ["icicibank.com"], "official_url": "https://icicibank.com"},
    "axis": {"domains": ["axisbank.com"], "official_url": "https://axisbank.com"},
    "axisbank": {"domains": ["axisbank.com"], "official_url": "https://axisbank.com"},
    "pnb": {"domains": ["pnbindia.in"], "official_url": "https://pnbindia.in"},
    "amazon": {"domains": ["amazon.in", "amazon.com"], "official_url": "https://amazon.in"},
    "flipkart": {"domains": ["flipkart.com"], "official_url": "https://flipkart.com"},
    "paytm": {"domains": ["paytm.com"], "official_url": "https://paytm.com"},
    "phonepe": {"domains": ["phonepe.com"], "official_url": "https://phonepe.com"},
    "google": {"domains": ["google.com", "google.co.in"], "official_url": "https://google.com"},
    "apple": {"domains": ["apple.com"], "official_url": "https://apple.com"},
    "netflix": {"domains": ["netflix.com"], "official_url": "https://netflix.com"},
    "indiapost": {"domains": ["indiapost.gov.in"], "official_url": "https://indiapost.gov.in"}
}

SUSPICIOUS_TLDS = {".xyz", ".top", ".tk", ".click", ".work", ".gq", ".cf", ".ml", ".cc", ".icu", ".buzz", ".monster"}

# Pre-compiled Regexes
RE_PHONE = re.compile(r'\b[6-9]\d{9}\b')
RE_EMAIL = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b')
RE_IPV4 = re.compile(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$')
RE_URL = re.compile(r'https?://[^\s<>"]+|www\.[^\s<>"]+', re.IGNORECASE)
RE_STRICT_DOMAIN = re.compile(r'\b(?:[a-zA-Z0-9-]+\.)+(?:com|in|org|net|xyz|top|tk|click|gov|edu|io|co|ai|live|buzz|site|online)\b', re.IGNORECASE)

# Expanded urgency and utility patterns
URGENCY_PATTERN = re.compile(
    r'\b(account suspended|blocked within 24 hours|blocked immediately|kyc update|verify pan|'
    r'urgent action|electricity disconnected|disconnection notice|unpaid bill|unpaid bill overdue|'
    r'power connection will be cut|will be disconnected|lottery winner|congratulations won|'
    r'claim reward|tax refund pending|service disconnection|deactivation|action required|'
    r'unauthorized access|temporary lock|immediate action)\b', re.IGNORECASE
)

CREDENTIAL_PATTERN = re.compile(
    r'\b(otp|pin|cvv|netbanking password|atm pin|secret key|card number|expiry date|'
    r'login credentials|security question|verify identity)\b', re.IGNORECASE
)

EMAIL_SUSPICIOUS_PATTERN = re.compile(
    r'\b(dear customer|dear user|security alert|billing issue|payment failed|suspended transaction|confirm your account)\b', re.IGNORECASE
)

# Substring-safe regex matching across URIs, parameters, and text with underscores
UPI_FRAUD_TRIGGER_PATTERN = re.compile(
    r'(cashback|refund|lottery|won|claim|free|bonus|reward|prize|winner|collect)', 
    re.IGNORECASE
)

def redact_pii(text: str) -> tuple[str, bool]:
    found = False
    if RE_PHONE.search(text):
        text = RE_PHONE.sub('[REDACTED_PHONE]', text)
        found = True
    if RE_EMAIL.search(text):
        text = RE_EMAIL.sub('[REDACTED_EMAIL]', text)
        found = True
    return text, found

# Common visual character swaps used by typosquatters
HOMOGLYPH_MAP = {
    '0': 'o',
    '1': 'l',
    '3': 'e',
    '4': 'a',
    '@': 'a',
    '5': 's',
    '8': 'b',
    'vv': 'w'
}

def normalize_homoglyphs(text: str) -> str:
    cleaned = text
    for char, replacement in HOMOGLYPH_MAP.items():
        cleaned = cleaned.replace(char, replacement)
    return cleaned

def fast_levenshtein_ratio(s1: str, s2: str) -> float:
    l1, l2 = len(s1), len(s2)
    if abs(l1 - l2) > 3:
        return 0.0
    if s1 == s2:
        return 1.0

    dp = list(range(l2 + 1))
    for i, c1 in enumerate(s1):
        new_dp = [i + 1] * (l2 + 1)
        for j, c2 in enumerate(s2):
            cost = 0 if c1 == c2 else 1
            new_dp[j + 1] = min(dp[j + 1] + 1, new_dp[j] + 1, dp[j] + cost)
        dp = new_dp

    dist = dp[l2]
    max_len = max(l1, l2)
    return 1.0 - (dist / max_len)

def check_domain_safety(hostname: str) -> tuple[int, list[str], str, str, bool]:
    flags = []
    score = 0
    detected_brand = None
    safe_alternative = None

    clean_host = hostname.lower().replace("www.", "").split(":")[0].strip(".")
    if "." not in clean_host:
        return 0, [], None, None, False

    if RE_IPV4.match(clean_host):
        return 50, [f"Direct IP Hosting: Uses raw IP ({clean_host}) bypassing DNS trust."], detected_brand, safe_alternative, False

    dot_idx = clean_host.rfind(".")
    if dot_idx != -1 and clean_host[dot_idx:] in SUSPICIOUS_TLDS:
        score += 45
        flags.append(f"High-Risk Disposable TLD: Registered on '{clean_host[dot_idx:]}'.")

    domain_parts = clean_host.split(".")
    domain_label = domain_parts[0]
    normalized_label = normalize_homoglyphs(domain_label)

    # 1. Baseline whitelist check (Exact matches)
    for brand, info in AUTHENTIC_DOMAINS.items():
        for auth_d in info["domains"]:
            if clean_host == auth_d or clean_host.endswith("." + auth_d):
                return 0, [], brand, info["official_url"], True

    # 2. Homoglyph / Lookalike Substitution Check (e.g., amaz0n, amaz0)
    for brand, info in AUTHENTIC_DOMAINS.items():
        if brand in clean_host or brand in normalized_label:
            score += 65
            flags.append(f"Brand Impersonation / Homoglyph Spoof: Domain '{clean_host}' mimics protected brand '{brand.upper()}'.")
            return score, flags, brand, info["official_url"], False

        # Levenshtein distance check with homoglyph & normalized threshold (0.65 for shorter words)
        if len(domain_label) >= 3 and len(brand) >= 3:
            ratio_raw = fast_levenshtein_ratio(domain_label, brand)
            ratio_norm = fast_levenshtein_ratio(normalized_label, brand)
            best_ratio = max(ratio_raw, ratio_norm)

            threshold = 0.65 if len(brand) <= 6 else 0.75
            if best_ratio >= threshold:
                score += 60
                flags.append(f"Typosquatting Lookalike: '{clean_host}' mimics '{brand.upper()}' ({int(best_ratio*100)}% match).")
                return score, flags, brand, info["official_url"], False

    # Generic unverified domain
    score += 25
    flags.append(f"Unverified Domain: '{clean_host}' is not in the authentic brand registry.")
    return score, flags, detected_brand, safe_alternative, False
def analyze_payload(raw_text: str, content_type: str = "Message") -> dict:
    sanitized_text, pii_redacted = redact_pii(raw_text)
    text_lower = sanitized_text.lower()
    
    score = 0
    signals = []
    detected_brand = None
    safe_alternative_url = None
    is_upi_fraud = False
    has_whitelisted_domain = False
    is_upi_scheme = "upi://pay" in text_lower or (content_type in ["QR Code", "QR / UPI"] and "upi" in text_lower)

    # -------------------------------------------------------------
    # 1. DEDICATED UPI EVALUATION ENGINE
    # -------------------------------------------------------------
    if is_upi_scheme:
        # Check if the payment intent uses incoming reward / cashback bait
        if UPI_FRAUD_TRIGGER_PATTERN.search(sanitized_text):
            score = 90
            signals.append([
                "Reverse-Payment Fraud",
                "Promises incoming rewards/cashback but executes an outbound DEBIT payment intent (upi://pay)."
            ])
            is_upi_fraud = True
            threat_type = "Financial Scam (Reverse-UPI Trap)"
            explanation = "This QR/UPI payload is disguised as a cashback reward, but scanning/authorizing it will debit ₹ from your bank account."
            potential_impacts = ["Direct bank balance deduction", "Unauthorized money transfer"]
            recommendations = ["Never enter your UPI PIN to receive money.", "Do not approve or scan this payment link."]
            safe_alternative = "Open your official UPI application directly to check genuine cashback offers."
        else:
            score = 0
            signals.append(["Standard UPI Payment URI", "Standard direct payment transfer structure. No reverse-payment triggers."])
            threat_type = "Legitimate / Safe UPI Payment"
            explanation = "Standard merchant or peer-to-peer UPI transfer string without fraudulent cashback triggers."
            potential_impacts = ["Minimal operational risk"]
            recommendations = ["Verify the payee name before entering your MPIN."]
            safe_alternative = "Proceed using your verified banking or UPI app."

        risk_level = "HIGH" if score >= 60 else "LOW"
        
        return {
            "input": sanitized_text,
            "type": content_type,
            "riskScore": score,
            "riskLevel": risk_level,
            "threatType": threat_type,
            "signals": signals,
            "explanation": explanation,
            "potentialImpacts": potential_impacts,
            "recommendations": recommendations,
            "safeAlternative": safe_alternative,
            "piiRedacted": pii_redacted,
            "createdAt": ""
        }

    # -------------------------------------------------------------
    # 2. STANDARD URL / MESSAGE / EMAIL EVALUATION ENGINE
    # -------------------------------------------------------------
    extracted = set(RE_URL.findall(sanitized_text) + RE_STRICT_DOMAIN.findall(sanitized_text))
    for item in extracted:
        try:
            full_url = item if "://" in item else f"http://{item}"
            parsed = urlparse(full_url)
            hostname = parsed.hostname or parsed.path.split("/")[0]

            if parsed.scheme == "http" and not RE_IPV4.match(hostname):
                score += 20
                signals.append(["Insecure Protocol", f"Missing SSL/TLS encryption (HTTP) on {hostname}."])

            d_score, d_flags, d_brand, d_alt, is_white = check_domain_safety(hostname)
            if is_white:
                has_whitelisted_domain = True
                safe_alternative_url = d_alt
            else:
                score += d_score
                for f in d_flags:
                    signals.append(["Domain Anomaly", f])
                if d_brand:
                    detected_brand = d_brand
                if d_alt:
                    safe_alternative_url = d_alt
        except Exception:
            pass

    # 3. Urgency & Coercive Triggers
    urgency_matches = list(set(URGENCY_PATTERN.findall(sanitized_text)))
    if urgency_matches:
        score += min(len(urgency_matches) * 25, 50)
        signals.append(["Artificial Urgency", f"Panic triggers found: '{', '.join(urgency_matches)}'."])

    # 4. Personal Mobile Lure in Urgent Alerts
    if pii_redacted and urgency_matches:
        score += 35
        signals.append(["Direct Call Lure", "Coercive notice prompts calling an unofficial personal mobile number."])

    # 5. Credential Solicitation
    cred_matches = list(set(CREDENTIAL_PATTERN.findall(sanitized_text)))
    if cred_matches:
        score += 35
        signals.append(["Credential Solicitation", f"Requests sensitive secrets: '{', '.join(cred_matches)}'."])

    # 6. Email Specific Heuristics
    if content_type.lower() == "email":
        email_matches = list(set(EMAIL_SUSPICIOUS_PATTERN.findall(sanitized_text)))
        if email_matches:
            score += 25
            signals.append(["Deceptive Email Patterns", f"Generic greeting/lure keywords: '{', '.join(email_matches)}'."])

    if has_whitelisted_domain and not (urgency_matches or cred_matches):
        score = 0
        signals = []

    final_score = min(score, 100) if (score > 0) else 0

    if final_score <= 24:
        risk_level = "LOW"
    elif final_score <= 59:
        risk_level = "MEDIUM"
    else:
        risk_level = "HIGH"

    phishing_indicators = any("impersonation" in s[1].lower() or "typosquatting" in s[1].lower() or "credential" in s[0].lower() or "tld" in s[1].lower() for s in signals)
    scam_indicators = bool(re.search(r'\b(lottery|cashback|refund|unpaid bill|electricity|power connection|disconnection)\b', sanitized_text, re.IGNORECASE))

    if phishing_indicators:
        threat_type = "Phishing (Brand Spoofing & Credential Theft)"
        explanation = "High-confidence brand impersonation attempting to capture credentials or financial access."
        potential_impacts = ["Account takeover", "Identity compromise", "Stolen banking credentials"]
        recommendations = ["Do NOT click links or enter passwords.", "Block sender immediately.", "Verify via the genuine portal."]
        safe_alternative = safe_alternative_url or "Open the authentic website directly by typing its known address."
    elif scam_indicators:
        threat_type = "Social Engineering / Financial Scam"
        explanation = "Coercive social engineering trap designed to panic you into calling unverified contacts or approving an unauthorized money transfer."
        potential_impacts = ["Direct bank balance deduction", "Personal data harvesting", "Financial loss"]
        recommendations = ["Never enter your UPI MPIN to receive money.", "Do not authorize unfamiliar prompts.", "File a complaint on cybercrime.gov.in."]
        safe_alternative = "Open your official utility or banking app directly."
    elif risk_level == "LOW":
        threat_type = "Legitimate / Safe Content"
        explanation = "No malicious signatures, reverse-payment traps, or deceptive patterns detected."
        potential_impacts = ["Minimal operational risk"]
        recommendations = ["Standard browsing and payment caution applies."]
        safe_alternative = safe_alternative_url or "Proceed using verified official channels."
    else:
        threat_type = "Suspicious Digital Artifact"
        explanation = "Payload contains suspicious wording or unverified domain structures."
        potential_impacts = ["Potential spam or tracking exposure"]
        recommendations = ["Verify sender identity through independent channels."]
        safe_alternative = "Navigate directly to official apps."

    if not signals:
        signals = [["Verified Safe Match", "No known malicious heuristics or typosquatting signatures found."]]

    return {
        "input": sanitized_text,
        "type": content_type,
        "riskScore": final_score,
        "riskLevel": risk_level,
        "threatType": threat_type,
        "signals": signals,
        "explanation": explanation,
        "potentialImpacts": potential_impacts,
        "recommendations": recommendations,
        "safeAlternative": safe_alternative,
        "piiRedacted": pii_redacted,
        "createdAt": ""
    }