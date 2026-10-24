from datetime import datetime, timedelta
from app.extensions import db
from app.models.attack_log import AttackLog
from app.models.live_request import LiveRequest
from app.models.threat_analytics import ThreatAnalytics
from app.repositories.base_repository import BaseRepository

class AnalyticsRepository(BaseRepository):
    def __init__(self):
        super().__init__(ThreatAnalytics)

    def search(self, query_string, page=1, per_page=10):
        """Search ThreatAnalytics by attack_type."""
        query = self.model.query
        if query_string:
            query = query.filter(self.model.attack_type.like(f"%{query_string}%"))
        return self.paginate(query, page, per_page)

    def get_dashboard_stats(self):
        """
        Calculates core KPI parameters dynamically:
        Total Requests, Blocked Requests, Today's Attacks, Detection Accuracy, Threat Score
        """
        # 1. Total Requests (Live Requests + Attack Logs)
        live_count = db.session.query(db.func.count(LiveRequest.id)).scalar() or 0
        attack_count = db.session.query(db.func.count(AttackLog.id)).scalar() or 0
        total_requests = live_count + attack_count

        # 2. Blocked Requests
        blocked_requests = db.session.query(db.func.count(AttackLog.id)).filter(
            (AttackLog.blocked == True) | (AttackLog.status.ilike('blocked'))
        ).scalar() or 0

        # 3. Today's Attacks
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        todays_attacks = db.session.query(db.func.count(AttackLog.id)).filter(
            AttackLog.timestamp >= today_start
        ).scalar() or 0

        # 4. Detection Accuracy (average confidence of blocked logs)
        avg_confidence = db.session.query(db.func.avg(AttackLog.confidence)).filter(
            AttackLog.prediction != 'Safe'
        ).scalar()
        detection_accuracy = round(float(avg_confidence), 2) if avg_confidence else 0.0

        # 5. Threat Score (average risk score of logs)
        avg_risk = db.session.query(db.func.avg(AttackLog.risk_score)).scalar()
        threat_score = round(float(avg_risk), 1) if avg_risk else 0.0

        return {
            "totalRequests": total_requests,
            "blockedRequests": blocked_requests,
            "todaysAttacks": todays_attacks,
            "detectionAccuracy": detection_accuracy,
            "threatScore": threat_score
        }

    def get_detailed_analytics(self):
        """
        Calculates:
        - Top Payload
        - Top Endpoint
        - Top IP
        - Average Response Time
        - Threat Distribution (Low, Medium, High, Critical)
        - Weekly Trend (Last 4 weeks)
        - Monthly Trend (Last 6 months)
        """
        # 1. Top Payload
        top_payload_row = db.session.query(
            AttackLog.payload, db.func.count(AttackLog.id).label('count')
        ).filter(AttackLog.payload != None, AttackLog.payload != '').group_by(
            AttackLog.payload
        ).order_by(db.desc('count')).first()
        most_common_payload = top_payload_row[0] if top_payload_row else "None"

        # 2. Top IP
        top_ip_row = db.session.query(
            AttackLog.client_ip, db.func.count(AttackLog.id).label('count')
        ).group_by(AttackLog.client_ip).order_by(db.desc('count')).first()
        top_attacking_ip = top_ip_row[0] if top_ip_row else "None"

        # 3. Top Endpoint
        top_endpoint_row = db.session.query(
            AttackLog.url, db.func.count(AttackLog.id).label('count')
        ).group_by(AttackLog.url).order_by(db.desc('count')).first()
        top_endpoint = top_endpoint_row[0] if top_endpoint_row else "None"

        # 4. Average Response Time
        avg_rt = db.session.query(db.func.avg(AttackLog.response_time)).scalar()
        average_response_time = f"{round(float(avg_rt), 1)} ms" if avg_rt else "0.0 ms"

        # 5. Threat Distribution
        low_count = db.session.query(db.func.count(AttackLog.id)).filter(AttackLog.threat_level.ilike('low')).scalar() or 0
        med_count = db.session.query(db.func.count(AttackLog.id)).filter(AttackLog.threat_level.ilike('medium')).scalar() or 0
        high_count = db.session.query(db.func.count(AttackLog.id)).filter(AttackLog.threat_level.ilike('high')).scalar() or 0
        crit_count = db.session.query(db.func.count(AttackLog.id)).filter(AttackLog.threat_level.ilike('critical')).scalar() or 0

        threat_distribution = [
            { "name": "Low Risk", "value": low_count },
            { "name": "Medium Risk", "value": med_count },
            { "name": "High Risk", "value": high_count },
            { "name": "Critical Risk", "value": crit_count }
        ]

        # 6. Weekly Trend (Calculated for last 4 weeks)
        weekly_trend = []
        today = datetime.utcnow()
        for i in range(4, 0, -1):
            start_week = today - timedelta(weeks=i)
            end_week = start_week + timedelta(weeks=1)
            attacks = db.session.query(db.func.count(AttackLog.id)).filter(
                AttackLog.timestamp >= start_week,
                AttackLog.timestamp < end_week
            ).scalar() or 0
            blocked = db.session.query(db.func.count(AttackLog.id)).filter(
                AttackLog.timestamp >= start_week,
                AttackLog.timestamp < end_week,
                ((AttackLog.blocked == True) | (AttackLog.status.ilike('blocked')))
            ).scalar() or 0
            
            weekly_trend.append({
                "week": f"Week {5-i}",
                "attacks": attacks,
                "blocked": blocked
            })

        # 7. Monthly Trend (Calculated for last 6 months)
        monthly_trend = []
        months_short = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        for i in range(5, -1, -1):
            first_of_this_month = today.replace(day=1)
            target_month_date = first_of_this_month - timedelta(days=i*30)
            month_label = months_short[target_month_date.month - 1]
            
            start_month = target_month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if target_month_date.month == 12:
                end_month = start_month.replace(year=start_month.year + 1, month=1)
            else:
                end_month = start_month.replace(month=start_month.month + 1)

            threats = db.session.query(db.func.count(AttackLog.id)).filter(
                AttackLog.timestamp >= start_month,
                AttackLog.timestamp < end_month
            ).scalar() or 0
            mitigated = db.session.query(db.func.count(AttackLog.id)).filter(
                AttackLog.timestamp >= start_month,
                AttackLog.timestamp < end_month,
                ((AttackLog.blocked == True) | (AttackLog.status.ilike('blocked')))
            ).scalar() or 0

            monthly_trend.append({
                "month": month_label,
                "threats": threats,
                "mitigated": mitigated
            })

        return {
            "mostCommonPayload": most_common_payload,
            "topAttackingIp": top_attacking_ip,
            "topEndpoint": top_endpoint,
            "averageResponseTime": average_response_time,
            "threatDistribution": threat_distribution,
            "weeklyTrend": weekly_trend,
            "monthlyTrend": monthly_trend
        }
