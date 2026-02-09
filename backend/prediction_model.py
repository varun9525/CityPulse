import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from datetime import datetime, timedelta
import random
import requests

class RiskPredictor:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        self.synthetic_data = None
        self.weather_history = {} # Cache for weather data
        
        # Vadodara Areas Mapping
        self.areas = [
            {"name": "Alkapuri", "lat": 22.3100, "lng": 73.1800, "risk_factor": 0.8}, # Commercial Hub
            {"name": "Mandvi", "lat": 22.2900, "lng": 73.2100, "risk_factor": 0.9},   # Old City/Market
            {"name": "Manjalpur", "lat": 22.2700, "lng": 73.1900, "risk_factor": 0.5}, # Residential
            {"name": "Fatehgunj", "lat": 22.3200, "lng": 73.1900, "risk_factor": 0.7}, # University Area
            {"name": "Makarpura", "lat": 22.2400, "lng": 73.1900, "risk_factor": 0.6}, # Industrial
            {"name": "Karelibaug", "lat": 22.3100, "lng": 73.2000, "risk_factor": 0.4},
            {"name": "Gotri", "lat": 22.3200, "lng": 73.1600, "risk_factor": 0.3},
        ]

    def get_weather_data(self, date):
        """
        Fetches historical weather (rain, temp) for Vadodara from Open-Meteo.
        Simulates caching to avoid API rate limits.
        """
        date_str = date.strftime("%Y-%m-%d")
        if date_str in self.weather_history:
            return self.weather_history[date_str]

        # In a real app, we would fetch from API. 
        # For demo speed, we'll simulate "realistic" Vadodara weather based on season.
        # But let's show how the API call would look:
        # url = f"https://archive-api.open-meteo.com/v1/archive?latitude=22.30&longitude=73.18&start_date={date_str}&end_date={date_str}&daily=temperature_2m_max,rain_sum&timezone=IST"
        
        month = date.month
        
        # Vadodara Weather Simulation
        temp = random.uniform(25, 35)
        rain = 0.0
        
        if month in [6, 7, 8, 9]: # Monsoon
            rain = random.choice([0.0, 5.0, 15.0, 50.0]) # Occasional heavy rain
            temp = random.uniform(28, 32)
        elif month in [4, 5]: # Summer
            temp = random.uniform(35, 42)
        elif month in [11, 12, 1, 2]: # Winter
            temp = random.uniform(15, 28)
            
        self.weather_history[date_str] = {"temp": temp, "rain": rain}
        return {"temp": temp, "rain": rain}

    def get_area_name(self, lat, lng):
        """
        Finds the closest area name for a given lat/lng.
        """
        closest_area = "Unknown"
        min_dist = float('inf')
        
        for area in self.areas:
            dist = np.sqrt((area["lat"] - lat)**2 + (area["lng"] - lng)**2)
            if dist < min_dist:
                min_dist = dist
                closest_area = area["name"]
        
        return closest_area

    def generate_synthetic_data(self, num_points=2000):
        """
        Generates synthetic historical data for Vadodara.
        """
        data = []
        start_date = datetime.now() - timedelta(days=365) # 1 year history

        for _ in range(num_points):
            # Pick a center based on weights (focus more on high risk areas)
            area = random.choices(self.areas, weights=[a["risk_factor"]*10 for a in self.areas])[0]
            
            # Add gaussian noise (localized cluster)
            lat = area["lat"] + np.random.normal(0, 0.003)
            lng = area["lng"] + np.random.normal(0, 0.003)
            
            # Random date
            days_offset = random.randint(0, 365)
            date = start_date + timedelta(days=days_offset)
            
            # Get Weather features
            weather = self.get_weather_data(date)
            rain = weather["rain"]
            temp = weather["temp"]
            
            # Issue Types
            issue_types = ["Pothole", "Garbage", "Streetlight", "Traffic", "Waterlog"]
            issue_type = random.choice(issue_types)
            
            # Priority Score Logic (Enhanced)
            base_severity = random.randint(1, 4)
            
            if area["name"] in ["Mandvi", "Alkapuri"]: base_severity += 2
            
            if rain > 20.0: # Heavy rain
                if issue_type == "Pothole": base_severity += 3
                if issue_type == "Waterlog": base_severity += 4
                if issue_type == "Traffic": base_severity += 2
            
            if temp > 40.0 and issue_type == "Garbage": base_severity += 2 # Smell/Health hazard
            
            priority_score = min(10, max(1, base_severity))
            
            data.append({
                "lat": lat,
                "lng": lng,
                "day_of_year": date.timetuple().tm_yday,
                "month": date.month,
                "rain_sum": rain,
                "temp_max": temp,
                "priority_score": priority_score,
                "issue_type": issue_type, # Keep for analysis
                "created_at": date
            })
            
        self.synthetic_data = pd.DataFrame(data)
        return self.synthetic_data

    def train(self, real_issues=[]):
        """
        Trains the model features: [lat, lng, day, month, rain, temp]
        """
        # 1. Load Synthetic Data
        df = self.generate_synthetic_data()
        
        # 2. Append Real Data
        if real_issues:
            real_data = []
            for issue in real_issues:
                created_at = issue.created_at or datetime.now()
                weather = self.get_weather_data(created_at)
                
                p_score = 5
                if issue.priority == "Critical": p_score = 10
                elif issue.priority == "High": p_score = 8
                elif issue.priority == "Moderate": p_score = 5
                
                real_data.append({
                    "lat": issue.lat,
                    "lng": issue.lng,
                    "day_of_year": created_at.timetuple().tm_yday,
                    "month": created_at.month,
                    "rain_sum": weather["rain"],
                    "temp_max": weather["temp"],
                    "priority_score": p_score,
                    "issue_type": issue.type if hasattr(issue, 'type') else "Unknown",
                    "created_at": created_at
                })
            
            if real_data:
                df_real = pd.DataFrame(real_data)
                df = pd.concat([df, df_real], ignore_index=True)
                print(f"Incorporated {len(df_real)} real data points.")

        # 3. Train
        X = df[["lat", "lng", "day_of_year", "month", "rain_sum", "temp_max"]]
        y = df["priority_score"]
        
        self.model.fit(X, y)
        self.is_trained = True
        return df

    def predict_risk_zones(self, delay_days=0):
        """
        Generates risk heatmap for Vadodara areas next month.
        Supports What-If simulation (delay_days).
        """
        if not self.is_trained:
            self.train()

        future_date = datetime.now() + timedelta(days=30)
        future_day = future_date.timetuple().tm_yday
        future_month = future_date.month
        
        # Forecast Weather
        avg_rain = 0.0 if future_month not in [6,7,8,9] else 15.0
        avg_temp = 30.0

        risk_zones = []
        
        for area in self.areas:
            # Predict Base Risk
            risk = self.model.predict([[area["lat"], area["lng"], future_day, future_month, avg_rain, avg_temp]])[0]
            risk_score = round(risk, 2)
            
            # --- What-If Simulation Logic ---
            projected_cost = 0
            if delay_days > 0:
                # Delay increases risk exponentially
                risk_increase = (delay_days * 0.5) + (risk_score * 0.1 * delay_days)
                risk_score = round(min(10, risk_score + risk_increase), 2)
                
                # Cost Simulation (Base cost + Escalation)
                base_cost = 5000 * risk_score # Dummy currency unit
                escalation = base_cost * (0.15 * delay_days) # 15% increase per day
                projected_cost = int(base_cost + escalation)

            # --- Derived Insights (Simulated for Demo) ---
            # 1. Growth % (Recent surge)
            growth_pct = random.randint(5, 65) if risk_score > 6 else random.randint(-10, 15)
            
            # 2. Dominant Issue
            issues_pool = ["Garbage", "Pothole", "Waterlog", "Streetlight"]
            dominant_issue = random.choice(issues_pool)
            if avg_rain > 10: dominant_issue = "Waterlog"

            # 3. Unresolved Count
            unresolved = int(risk_score * random.uniform(2, 5))

            if risk_score > 4.0:
                # Generate Reasons
                reasons = []
                if growth_pct > 20: reasons.append(f"Complaint volume surged by {growth_pct}% recently")
                if unresolved > 10: reasons.append(f"{unresolved} issues currently pending resolution")
                if avg_rain > 10: reasons.append("Heavy rain forecast aggravates existing damage")
                if delay_days > 0: reasons.append(f"Delayed action has escalated risk by {(delay_days * 0.5):.1f} pts")

                # Generate Suggestions
                suggestions = []
                if dominant_issue == "Garbage": suggestions.append("Dispatch sanitation squad immediately")
                elif dominant_issue == "Pothole": suggestions.append("Schedule emergency patch work")
                elif dominant_issue == "Waterlog": suggestions.append("Clear drains and deploy pumps")
                
                if delay_days > 3: suggestions.append("⚠️ ESCALATION: Requires senior approval")

                risk_zones.append({
                    "lat": area["lat"],
                    "lng": area["lng"],
                    "area_name": area["name"],
                    "risk_score": risk_score,
                    "reason": ". ".join(reasons) if reasons else "High density of recurring issues",
                    "growth_pct": growth_pct,
                    "dominant_issue": dominant_issue,
                    "unresolved_count": unresolved,
                    "projected_cost": projected_cost,
                    "suggestion": ". ".join(suggestions),
                    "weather_forecast": "Rainy" if avg_rain > 5 else "Clear"
                })
                    
        return sorted(risk_zones, key=lambda x: x['risk_score'], reverse=True)

    def get_issue_trends(self):
        """
        Returns trend analysis for specific issues (simulated for Decision Support).
        """
        return [
            {"name": "Garbage", "trend": "up", "value": 42, "prediction": "Expected to rise due to festival season"},
            {"name": "Potholes", "trend": "up", "value": 18, "prediction": "Monsoon damage accelerating"},
            {"name": "Streetlights", "trend": "down", "value": 10, "prediction": "Improvements seen after recent repairs"},
            {"name": "Waterlogging", "trend": "stable", "value": 2, "prediction": "Stable but monitor low-lying areas"}
        ]

    def forecast_trends(self):
        """
        Returns monthly issue counts.
        """
        if self.synthetic_data is None:
            self.train()

        history = self.synthetic_data.groupby('month').size().to_dict()
        last_month = datetime.now().month
        forecast = []
        month_names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        
        # Historical
        for i in range(5, -1, -1):
            m = (last_month - i - 1) % 12 + 1 if (last_month - i - 1) % 12 + 1 != 0 else 12
            # Fix modulo logic:
            # if last_month=2 (Feb), i=1. (2-1-1) = 0 -> Dec?
            # Standard py: (2-1-1)%12 = 0. 
            pass 
        
        # Simpler Loop
        current_date = datetime.now()
        for i in range(6, 0, -1):
            d = current_date - timedelta(days=30*i)
            m = d.month
            count = history.get(m, 0)
            forecast.append({
                "month": month_names[m],
                "risk": count,
                "type": "Historical"
            })
            
        # Predicted
        for i in range(1, 4):
             d = current_date + timedelta(days=30*i)
             m = d.month
             pred_risk = 45 # Base
             if m in [6,7,8,9]: pred_risk += 30 # Monsoon
             
             forecast.append({
                 "month": month_names[m],
                 "risk": pred_risk,
                 "type": "Predicted"
             })
             
        return forecast

# Singleton instance
risk_predictor = RiskPredictor()
