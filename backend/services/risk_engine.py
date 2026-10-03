from typing import List, Dict, Any, Tuple

def calculate_risk(findings: List[Dict[str, Any]], business_criticality: str = "HIGH") -> Dict[str, Any]:
    """
    Computes explainable rule-based risk scoring.
    Caps score at 100.
    Calculates severity level:
      0-24: LOW
      25-49: MEDIUM
      50-74: HIGH
      75-100: CRITICAL
    Returns:
      {
        "risk_score": int,
        "severity": str,
        "factors": [
          {
            "rule": rule_id,
            "title": title,
            "category": category,
            "score": score,
            "evidence": evidence,
            "recommendation": recommendation
          }
        ]
      }
    """
    raw_score = sum(f.get("score", 0) for f in findings)
    final_score = min(100, max(0, raw_score))
    
    # Classify severity
    if final_score >= 75:
        severity = "CRITICAL"
    elif final_score >= 50:
        severity = "HIGH"
    elif final_score >= 25:
        severity = "MEDIUM"
    else:
        severity = "LOW"
        
    factors = []
    for f in findings:
        factors.append({
            "rule": f.get("rule_id", "UNKNOWN_RULE"),
            "title": f.get("title", "Security Finding"),
            "category": f.get("category", "GENERAL"),
            "score": f.get("score", 0),
            "evidence": f.get("evidence", ""),
            "recommendation": f.get("recommendation", "")
        })

    return {
        "risk_score": final_score,
        "raw_score": raw_score,
        "severity": severity,
        "business_criticality": business_criticality,
        "factors": factors
    }
