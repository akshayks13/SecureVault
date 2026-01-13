"""
Password health analysis for detecting weak and reused passwords.
"""
from typing import List, Dict
from crypto.password_generator import calculate_password_strength


def analyze_password_health(passwords: List[Dict]) -> Dict:
    """
    Analyze password health across all stored passwords.
    
    Args:
        passwords: List of password dicts with 'id', 'name', 'password'
        
    Returns:
        Health report with weak, reused, and strong password counts
    """
    weak_passwords = []
    reused_passwords = []
    strong_passwords = []
    
    # Track password occurrences for reuse detection
    password_occurrences = {}
    
    for pwd in passwords:
        password_value = pwd.get('password', '')
        password_id = pwd.get('id')
        password_name = pwd.get('name', 'Unknown')
        
        # Track occurrences
        if password_value in password_occurrences:
            password_occurrences[password_value].append({
                'id': password_id,
                'name': password_name
            })
        else:
            password_occurrences[password_value] = [{
                'id': password_id,
                'name': password_name
            }]
        
        # Check strength
        strength = calculate_password_strength(password_value)
        
        if strength['level'] in ['weak', 'fair']:
            weak_passwords.append({
                'id': password_id,
                'name': password_name,
                'score': strength['score'],
                'level': strength['level'],
                'feedback': strength['feedback']
            })
        else:
            strong_passwords.append({
                'id': password_id,
                'name': password_name,
                'score': strength['score'],
                'level': strength['level']
            })
    
    # Find reused passwords
    for password_value, occurrences in password_occurrences.items():
        if len(occurrences) > 1:
            reused_passwords.append({
                'password_preview': password_value[:2] + '*' * 6,
                'count': len(occurrences),
                'items': occurrences
            })
    
    # Calculate overall score
    total = len(passwords)
    if total == 0:
        overall_score = 100
    else:
        weak_count = len(weak_passwords)
        reused_count = sum(len(r['items']) for r in reused_passwords)
        # Penalty for weak and reused passwords
        penalty = (weak_count * 10 + reused_count * 5)
        overall_score = max(0, 100 - penalty)
    
    # Determine overall health level
    if overall_score >= 80:
        overall_level = 'excellent'
    elif overall_score >= 60:
        overall_level = 'good'
    elif overall_score >= 40:
        overall_level = 'fair'
    else:
        overall_level = 'poor'
    
    return {
        'overall_score': overall_score,
        'overall_level': overall_level,
        'total_passwords': total,
        'weak_count': len(weak_passwords),
        'reused_count': len(reused_passwords),
        'strong_count': len(strong_passwords),
        'weak_passwords': weak_passwords,
        'reused_passwords': reused_passwords,
        'strong_passwords': strong_passwords,
        'recommendations': generate_recommendations(weak_passwords, reused_passwords, total)
    }


def generate_recommendations(weak: List, reused: List, total: int) -> List[str]:
    """Generate actionable recommendations based on health analysis."""
    recommendations = []
    
    if total == 0:
        recommendations.append("Start storing passwords to monitor their health.")
        return recommendations
    
    if len(weak) > 0:
        recommendations.append(f"Update {len(weak)} weak password(s) to stronger alternatives.")
    
    if len(reused) > 0:
        recommendations.append(f"Change {len(reused)} reused password(s) to unique ones.")
    
    if len(weak) == 0 and len(reused) == 0:
        recommendations.append("Great job! All your passwords are strong and unique.")
    
    recommendations.append("Use the password generator to create strong, random passwords.")
    recommendations.append("Consider enabling two-factor authentication where available.")
    
    return recommendations
