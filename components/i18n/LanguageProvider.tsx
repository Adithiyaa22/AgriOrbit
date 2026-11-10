"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import LanguageToggle from "./LanguageToggle";

export type AppLanguage = "en" | "ta";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const translations: Record<string, string> = {
  // Global navigation
  "Dashboard": "டாஷ்போர்டு",
  "Farmers": "விவசாயிகள்",
  "New Survey": "புதிய கணக்கெடுப்பு",
  "Fields": "வயல்கள்",
  "Surveys": "கணக்கெடுப்புகள்",
  "Drafts": "வரைவுகள்",
  "Profile": "சுயவிவரம்",
  "My Profile": "என் சுயவிவரம்",
  "Sign out": "வெளியேறு",
  "Back": "பின்செல்",
  "Cancel": "ரத்து செய்",
  "Save": "சேமி",
  "Save Draft": "வரைவைச் சேமி",
  "Save & Continue": "சேமித்து தொடர்க",
  "Continue": "தொடர்க",
  "Continue Survey": "கணக்கெடுப்பைத் தொடர்க",
  "Review": "மதிப்பாய்வு",
  "Submit": "சமர்ப்பி",
  "Submit Survey": "கணக்கெடுப்பைச் சமர்ப்பி",
  "Edit": "திருத்து",
  "Delete": "நீக்கு",
  "Close": "மூடு",
  "Clear": "அழி",
  "Loading...": "ஏற்றப்படுகிறது...",
  "Saving...": "சேமிக்கப்படுகிறது...",
  "Submitting...": "சமர்ப்பிக்கப்படுகிறது...",
  "Creating...": "உருவாக்கப்படுகிறது...",
  "Active": "செயலில்",
  "Inactive": "செயலற்றது",
  "Draft": "வரைவு",
  "Submitted": "சமர்ப்பிக்கப்பட்டது",
  "Completed": "முடிந்தது",
  "Not completed": "முடிக்கப்படவில்லை",
  "Yes": "ஆம்",
  "No": "இல்லை",
  "None": "எதுவுமில்லை",
  "Both": "இரண்டும்",
  "Other": "மற்றவை",
  "Search": "தேடு",
  "Filter": "வடிகட்டு",
  "Date": "தேதி",
  "Status": "நிலை",
  "Action": "செயல்",
  "Details": "விவரங்கள்",
  "Description": "விளக்கம்",
  "Account": "கணக்கு",
  "Settings": "அமைப்புகள்",
  "Analytics": "பகுப்பாய்வு",
  "Export": "ஏற்றுமதி",
  "Photos": "புகைப்படங்கள்",
  "Voice Library": "குரல் நூலகம்",
  "Audit Logs": "தணிக்கை பதிவுகள்",
  "Users & Roles": "பயனர்கள் மற்றும் பங்குகள்",
  "Survey Builder": "கணக்கெடுப்பு உருவாக்கி",

  // Authentication
  "Login": "உள்நுழைவு",
  "Sign in": "உள்நுழைக",
  "Email": "மின்னஞ்சல்",
  "Email Address": "மின்னஞ்சல் முகவரி",
  "Email address": "மின்னஞ்சல் முகவரி",
  "Password": "கடவுச்சொல்",
  "Confirm Password": "கடவுச்சொல்லை உறுதிப்படுத்து",
  "Confirm new password": "புதிய கடவுச்சொல்லை உறுதிப்படுத்து",
  "Forgot Password": "கடவுச்சொல் மறந்துவிட்டதா?",
  "Back to login": "உள்நுழைவுக்குத் திரும்பு",
  "Reset Password": "கடவுச்சொல்லை மீட்டமை",
  "Choose a new password for your AgriOrbit account.": "உங்கள் AgriOrbit கணக்கிற்குப் புதிய கடவுச்சொல்லைத் தேர்ந்தெடுக்கவும்.",
  "Unable to sign in.": "உள்நுழைய முடியவில்லை.",
  "Your account is inactive. Contact an administrator.": "உங்கள் கணக்கு செயலற்ற நிலையில் உள்ளது. நிர்வாகியைத் தொடர்பு கொள்ளவும்.",
  "A connection error occurred. Please try again.": "இணைப்பு பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.",

  // Branding
  "AgriOrbit": "AgriOrbit",
  "Agricultural Data Platform": "வேளாண் தரவு தளம்",
  "Field Data Collection": "வயல் தரவு சேகரிப்பு",
  "Farmer & Field Data Collection": "விவசாயி மற்றும் வயல் தரவு சேகரிப்பு",
  "Farmer & Field Data Collection Platform": "விவசாயி மற்றும் வயல் தரவு சேகரிப்பு தளம்",
  "Structured agricultural data collection made simple.": "கட்டமைக்கப்பட்ட வேளாண் தரவு சேகரிப்பை எளிமையாக்குகிறது.",
  "Built for field teams": "வயல் குழுக்களுக்காக உருவாக்கப்பட்டது",

  // Survey sections
  "Section A — Survey & Enumerator Details": "பிரிவு A — கணக்கெடுப்பு மற்றும் கணக்கெடுப்பாளர் விவரங்கள்",
  "Section B — Farmer Profile": "பிரிவு B — விவசாயி சுயவிவரம்",
  "Section C — Field / Land Details": "பிரிவு C — வயல் / நில விவரங்கள்",
  "Section D — Soil Details": "பிரிவு D — மண் விவரங்கள்",
  "Section E — Season & Crop History": "பிரிவு E — பருவம் மற்றும் பயிர் வரலாறு",
  "Section F — Seed & Variety": "பிரிவு F — விதை மற்றும் ரகம்",
  "Section G — Fertilizer & Other Inputs": "பிரிவு G — உரம் மற்றும் பிற இடுபொருட்கள்",
  "Section H — Water & Irrigation": "பிரிவு H — நீர் மற்றும் பாசனம்",
  "Section I — Crop Problems & Difficulties": "பிரிவு I — பயிர் பிரச்சினைகள் மற்றும் சிரமங்கள்",
  "Section J — Field Observation": "பிரிவு J — வயல் கண்காணிப்பு",
  "Section K — Harvest, Yield & Economics": "பிரிவு K — அறுவடை, விளைச்சல் மற்றும் பொருளாதாரம்",
  "Section L — Market & Selling": "பிரிவு L — சந்தை மற்றும் விற்பனை",
  "Section M — Labour & Farming Operations": "பிரிவு M — தொழிலாளர் மற்றும் வேளாண் செயல்பாடுகள்",
  "Section N — Farmer Knowledge & Tips": "பிரிவு N — விவசாயி அறிவு மற்றும் குறிப்புகள்",
  "Section O — Future Farmer Needs": "பிரிவு O — எதிர்கால விவசாயி தேவைகள்",
  "Section P — Final Review & Submission": "பிரிவு P — இறுதி மதிப்பாய்வு மற்றும் சமர்ப்பிப்பு",

  "Survey & Enumerator Details": "கணக்கெடுப்பு மற்றும் கணக்கெடுப்பாளர் விவரங்கள்",
  "Farmer Profile": "விவசாயி சுயவிவரம்",
  "Field & Land Details": "வயல் மற்றும் நில விவரங்கள்",
  "Soil Details": "மண் விவரங்கள்",
  "Season & Crop History": "பருவம் மற்றும் பயிர் வரலாறு",
  "Seed & Variety": "விதை மற்றும் ரகம்",
  "Fertilizer & Other Inputs": "உரம் மற்றும் பிற இடுபொருட்கள்",
  "Water & Irrigation": "நீர் மற்றும் பாசனம்",
  "Crop Problems & Difficulties": "பயிர் பிரச்சினைகள் மற்றும் சிரமங்கள்",
  "Field Observation": "வயல் கண்காணிப்பு",
  "Harvest, Yield & Economics": "அறுவடை, விளைச்சல் மற்றும் பொருளாதாரம்",
  "Market & Selling": "சந்தை மற்றும் விற்பனை",
  "Labour & Farming Operations": "தொழிலாளர் மற்றும் வேளாண் செயல்பாடுகள்",
  "Farmer Knowledge & Tips": "விவசாயி அறிவு மற்றும் குறிப்புகள்",
  "Future Farmer Needs": "எதிர்கால விவசாயி தேவைகள்",

  // Farmer
  "Add Farmer": "விவசாயியைச் சேர்",
  "Add New Farmer": "புதிய விவசாயியைச் சேர்",
  "Farmer Name": "விவசாயியின் பெயர்",
  "Full Name": "முழுப் பெயர்",
  "Enter farmer name": "விவசாயியின் பெயரை உள்ளிடவும்",
  "Enter full name": "முழுப் பெயரை உள்ளிடவும்",
  "Mobile": "கைபேசி",
  "Mobile Number": "கைபேசி எண்",
  "Enter mobile number": "கைபேசி எண்ணை உள்ளிடவும்",
  "Age group": "வயது குழு",
  "Gender": "பாலினம்",
  "Village": "கிராமம்",
  "Enter village": "கிராமத்தை உள்ளிடவும்",
  "Taluk / Block": "வட்டம் / தொகுதி",
  "Enter taluk or block": "வட்டம் அல்லது தொகுதியை உள்ளிடவும்",
  "District": "மாவட்டம்",
  "Enter district": "மாவட்டத்தை உள்ளிடவும்",
  "State": "மாநிலம்",
  "Enter state": "மாநிலத்தை உள்ளிடவும்",
  "Farming experience": "விவசாய அனுபவம்",
  "Farming experience (years)": "விவசாய அனுபவம் (ஆண்டுகள்)",
  "Farming type": "விவசாய வகை",
  "Land ownership": "நில உரிமை",
  "Agricultural land": "வேளாண் நிலம்",
  "Main farming activity": "முக்கிய வேளாண் செயல்பாடு",
  "Main income source": "முக்கிய வருமான மூலம்",
  "Training & support": "பயிற்சி மற்றும் ஆதரவு",
  "Information source": "தகவல் மூலம்",

  // Fields
  "Add Field": "வயலைச் சேர்",
  "Add New Field": "புதிய வயலைச் சேர்",
  "Add First Field": "முதல் வயலைச் சேர்",
  "Field Name": "வயல் பெயர்",
  "Enter field name": "வயல் பெயரை உள்ளிடவும்",
  "Field Code": "வயல் குறியீடு",
  "Area": "பரப்பளவு",
  "Area unit": "பரப்பளவு அலகு",
  "Land type": "நில வகை",
  "Nearby water source": "அருகிலுள்ள நீர் ஆதாரம்",
  "Road access": "சாலை அணுகல்",
  "Access condition": "அணுகல் நிலை",
  "Special features": "சிறப்பு அம்சங்கள்",
  "Boundary captured": "எல்லை பதிவு செய்யப்பட்டது",
  "Capture Current Location": "தற்போதைய இருப்பிடத்தைப் பதிவு செய்",
  "Capture GPS": "GPS-ஐப் பதிவு செய்",
  "Coordinates": "ஆயத்தொலைவுகள்",
  "Captured": "பதிவு செய்யப்பட்டது",
  "Capturing GPS...": "GPS பதிவு செய்யப்படுகிறது...",
  "Capturing location...": "இருப்பிடம் பதிவு செய்யப்படுகிறது...",

  // Common survey labels
  "Basic Information": "அடிப்படை தகவல்",
  "Basic details about the farmer": "விவசாயியின் அடிப்படை விவரங்கள்",
  "Basic identification details of the farmer.": "விவசாயியின் அடிப்படை அடையாள விவரங்கள்.",
  "Area & ownership": "பரப்பளவு மற்றும் உரிமை",
  "Crop Area": "பயிர் பரப்பளவு",
  "Crop Area & Dates": "பயிர் பரப்பளவு மற்றும் தேதிகள்",
  "Current Crop": "தற்போதைய பயிர்",
  "Previous Crop": "முந்தைய பயிர்",
  "Crop Per Season": "ஒரு பருவத்திற்கான பயிர்",
  "Crop Selection": "பயிர் தேர்வு",
  "Crop Rotation": "பயிர் சுழற்சி",
  "Crops Used in Rotation": "சுழற்சியில் பயன்படுத்தும் பயிர்கள்",
  "Crop Stage": "பயிர் நிலை",
  "Crop Health": "பயிர் ஆரோக்கியம்",
  "Crop Condition": "பயிர் நிலைமை",
  "Crop Problems": "பயிர் பிரச்சினைகள்",
  "Soil Type": "மண் வகை",
  "Soil Colour": "மண் நிறம்",
  "Soil Texture": "மண் அமைப்பு",
  "Drainage": "வடிகால்",
  "Fertility": "வளத்தன்மை",
  "Soil Test": "மண் பரிசோதனை",
  "pH": "pH",
  "Nitrogen": "நைட்ரஜன்",
  "Phosphorus": "பாஸ்பரஸ்",
  "Potassium": "பொட்டாசியம்",
  "Organic matter / manure": "கரிமப் பொருள் / இயற்கை உரம்",
  "Manure type": "உர வகை",
  "Seed Name": "விதை பெயர்",
  "Variety": "ரகம்",
  "Brand": "பிராண்ட்",
  "Purchase Location": "வாங்கிய இடம்",
  "Supplier / Dealer": "வழங்குநர் / விற்பனையாளர்",
  "Quantity": "அளவு",
  "Quantity Unit": "அளவு அலகு",
  "Seed Cost": "விதை செலவு",
  "Certified / Labelled": "சான்றளிக்கப்பட்ட / லேபிளிடப்பட்ட",
  "Used Before": "முன்பு பயன்படுத்தியது",
  "Previous Yield": "முந்தைய விளைச்சல்",
  "Satisfaction Rating": "திருப்தி மதிப்பீடு",
  "Water Source": "நீர் ஆதாரம்",
  "Irrigation Method": "பாசன முறை",
  "Water Availability": "நீர் கிடைக்கும் நிலை",
  "Irrigation Frequency": "பாசன அதிர்வெண்",
  "Irrigation Duration": "பாசன கால அளவு",
  "Seasonal Changes": "பருவகால மாற்றங்கள்",
  "Drip / Sprinkler Usage": "சொட்டு / தெளிப்பு பாசன பயன்பாடு",
  "Effectiveness": "செயல்திறன்",
  "Current Crop Problems": "தற்போதைய பயிர் பிரச்சினைகள்",
  "Recurring Problems": "மீண்டும் ஏற்படும் பிரச்சினைகள்",
  "Problem Type": "பிரச்சினை வகை",
  "Severity": "தீவிரம்",
  "Date Noticed": "கவனிக்கப்பட்ட தேதி",
  "Action Taken": "எடுத்த நடவடிக்கை",
  "Who Helped": "உதவியவர்",
  "Action Result": "நடவடிக்கை முடிவு",
  "Biggest Farming Challenge": "மிகப்பெரிய விவசாய சவால்",
  "Growth Condition": "வளர்ச்சி நிலை",
  "Soil Observation": "மண் கண்காணிப்பு",
  "Water Observation": "நீர் கண்காணிப்பு",
  "Pest Level": "பூச்சி அளவு",
  "Disease Level": "நோய் அளவு",
  "Weed Level": "களை அளவு",
  "Stress or Damage": "பாதிப்பு அல்லது சேதம்",
  "Observation Notes": "கண்காணிப்பு குறிப்புகள்",

  // Economics / market / labour
  "Area Harvested": "அறுவடை செய்யப்பட்ட பரப்பளவு",
  "Calculated Yield / Acre": "கணக்கிடப்பட்ட ஏக்கர் விளைச்சல்",
  "Expected Yield": "எதிர்பார்க்கப்படும் விளைச்சல்",
  "Actual Yield": "உண்மையான விளைச்சல்",
  "Total Production Cost": "மொத்த உற்பத்தி செலவு",
  "Seed Spend": "விதை செலவு",
  "Fertilizer Input Spend": "உரம் / இடுபொருள் செலவு",
  "Labour Cost": "தொழிலாளர் செலவு",
  "Irrigation Cost": "பாசன செலவு",
  "Transport Cost": "போக்குவரத்து செலவு",
  "Other Cost": "பிற செலவு",
  "Sold Quantity": "விற்பனை செய்யப்பட்ட அளவு",
  "Selling Price": "விற்பனை விலை",
  "Total Revenue": "மொத்த வருவாய்",
  "Estimated Profit": "மதிப்பிடப்பட்ட லாபம்",
  "Income Satisfaction": "வருமான திருப்தி",
  "Biggest Income Reduction": "வருமானக் குறைவிற்கான முக்கிய காரணம்",
  "Calculate Revenue & Profit": "வருவாய் மற்றும் லாபத்தைக் கணக்கிடு",
  "Selling Place": "விற்பனை இடம்",
  "Buyer Type": "வாங்குபவர் வகை",
  "Buyer Discovery": "வாங்குபவரை கண்டறிதல்",
  "Approximate distance to buyer": "வாங்குபவருக்கான தோராயமான தூரம்",
  "Transport Method": "போக்குவரத்து முறை",
  "Price Information Before Harvest": "அறுவடைக்கு முன் விலைத் தகவல்",
  "Price Decision": "விலை முடிவு",
  "Buyer Difficulty": "வாங்குபவர் தொடர்பான சிரமம்",
  "Storage Available": "சேமிப்பு வசதி",
  "Market Difficulty": "சந்தை சிரமம்",
  "Direct consumer": "நேரடி நுகர்வோர்",
  "Cooperative": "கூட்டுறவு",
  "Dealer": "விற்பனையாளர்",

  "People Working": "பணிபுரியும் நபர்கள்",
  "Labour Type": "தொழிலாளர் வகை",
  "Labour Availability": "தொழிலாளர் கிடைக்கும் நிலை",
  "Skilled Worker Difficulty": "திறமையான தொழிலாளர் சிரமம்",
  "Machinery Used": "பயன்படுத்திய இயந்திரங்கள்",
  "Activity Wanted to Mechanize": "இயந்திரமயமாக்க விரும்பும் செயல்பாடு",
  "Equipment Rental": "உபகரண வாடகை",
  "Rental Equipment Name": "வாடகை உபகரண பெயர்",
  "Rental Equipment Type": "வாடகை உபகரண வகை",
  "Rental Frequency": "வாடகை அதிர்வெண்",
  "Rental Cost": "வாடகை செலவு",
  "Rental Source": "வாடகை மூலம்",

  // Knowledge / future needs
  "Best Crop Result": "சிறந்த பயிர் முடிவு",
  "Best Seed Variety": "சிறந்த விதை ரகம்",
  "Successful Practice": "வெற்றிகரமான நடைமுறை",
  "Best Water Management": "சிறந்த நீர் மேலாண்மை",
  "Best Soil Management": "சிறந்த மண் மேலாண்மை",
  "Best Pest / Disease Management": "சிறந்த பூச்சி / நோய் மேலாண்மை",
  "Traditional / Local Practice": "பாரம்பரிய / உள்ளூர் நடைமுறை",
  "Beginner Advice": "தொடக்க விவசாயிக்கான ஆலோசனை",
  "Thing Farmer Wishes Known": "விவசாயி முன்பே அறிந்திருக்க விரும்பும் விஷயம்",
  "Skill Farmer Wants to Improve": "விவசாயி மேம்படுத்த விரும்பும் திறன்",
  "Willing to Share": "பகிர விருப்பமா",
  "Support Needed": "தேவையான ஆதரவு",
  "Useful Training": "பயனுள்ள பயிற்சி",
  "Interested in crop price information?": "பயிர் விலைத் தகவலில் ஆர்வமா?",
  "Interested in buyer information?": "வாங்குபவர் தகவலில் ஆர்வமா?",
  "Interested in weather information?": "வானிலைத் தகவலில் ஆர்வமா?",
  "Interested in training or expert sessions?": "பயிற்சி அல்லது நிபுணர் அமர்வுகளில் ஆர்வமா?",
  "Interested in comparing seed varieties?": "விதை ரகங்களை ஒப்பிடுவதில் ஆர்வமா?",
  "Interested in expense recording?": "செவுகளைப் பதிவு செய்வதில் ஆர்வமா?",
  "Interested in profitability information?": "லாபத்தன்மைத் தகவலில் ஆர்வமா?",
  "Next Season": "அடுத்த பருவம்",

  // Admin
  "Administration": "நிர்வாகம்",
  "Administrator": "நிர்வாகி",
  "Administrator access": "நிர்வாகி அணுகல்",
  "Administrators": "நிர்வாகிகள்",
  "Admin": "நிர்வாகி",
  "Super Admin": "முதன்மை நிர்வாகி",
  "Admin Portal": "நிர்வாகி தளம்",
  "Admin Accounts": "நிர்வாகி கணக்குகள்",
  "Intern Accounts": "இன்டர்ன் கணக்குகள்",
  "Create Admin": "நிர்வாகியை உருவாக்கு",
  "Create Intern": "இன்டர்னை உருவாக்கு",
  "Account Information": "கணக்கு தகவல்",
  "Account Role": "கணக்கு பங்கு",
  "Account Status": "கணக்கு நிலை",
  "Employee Code": "பணியாளர் குறியீடு",
  "Employee code": "பணியாளர் குறியீடு",
  "Active Interns": "செயலில் உள்ள இன்டர்ன்கள்",
  "Create and manage administrator accounts.": "நிர்வாகி கணக்குகளை உருவாக்கி நிர்வகிக்கவும்.",
  "Create a new field enumerator account": "புதிய வயல் கணக்கெடுப்பாளர் கணக்கை உருவாக்கவும்.",
  "Activity": "செயல்பாடு",
  "Actor": "செயல்படுத்தியவர்",
  "Action types": "செயல் வகைகள்",
  "All actions": "அனைத்து செயல்களும்",
  "All Statuses": "அனைத்து நிலைகளும்",
  "All sections": "அனைத்து பிரிவுகளும்",
  "All actor roles": "அனைத்து பயனர் பங்குகளும்",
  "All photo types": "அனைத்து புகைப்பட வகைகளும்",
  "Announcement": "அறிவிப்பு",
  "Announcement title": "அறிவிப்பு தலைப்பு",
  "Data Overview": "தரவு மேலோட்டம்",
  "Current status of survey records": "கணக்கெடுப்பு பதிவுகளின் தற்போதைய நிலை",
  "Distribution of registered farmers": "பதிவு செய்யப்பட்ட விவசாயிகளின் பகிர்வு",
  "Average": "சராசரி",
  "Created": "உருவாக்கப்பட்டது",
  "Account Created": "கணக்கு உருவாக்கப்பட்டது",
  "Company": "நிறுவனம்",

  // Common prompts / errors
  "Survey could not be loaded.": "கணக்கெடுப்பை ஏற்ற முடியவில்லை.",
  "Survey could not be found.": "கணக்கெடுப்பைக் கண்டறிய முடியவில்லை.",
  "Please try again.": "மீண்டும் முயற்சிக்கவும்.",
  "No data available.": "தரவு இல்லை.",
  "No records found.": "பதிவுகள் எதுவும் இல்லை.",
  "No farmers found.": "விவசாயிகள் எவரும் இல்லை.",
  "No fields found.": "வயல்கள் எதுவும் இல்லை.",
  "No surveys found.": "கணக்கெடுப்புகள் எதுவும் இல்லை.",
  "This survey is not available offline yet.": "இந்த கணக்கெடுப்பு இன்னும் ஆஃப்லைனில் கிடைக்கவில்லை.",
  "Data ready to sync": "ஒத்திசைக்க தரவு தயாராக உள்ளது",
  "Offline": "ஆஃப்லைன்",
  "Online": "ஆன்லைன்",

  // Dashboard / common screen copy
  "Welcome back": "மீண்டும் வரவேற்கிறோம்",
  "Welcome back,": "மீண்டும் வரவேற்கிறோம்,",
  "Manage farmers, fields, surveys, and field data collection from one place.": "விவசாயிகள், வயல்கள், கணக்கெடுப்புகள் மற்றும் வயல் தரவு சேகரிப்பை ஒரே இடத்தில் நிர்வகிக்கவும்.",
  "Start a new field survey": "புதிய வயல் கணக்கெடுப்பைத் தொடங்கவும்",
  "Select an existing farmer and field, then begin collecting field information.": "ஏற்கனவே உள்ள விவசாயி மற்றும் வயலைத் தேர்ந்தெடுத்து, வயல் தகவல்களைச் சேகரிக்கத் தொடங்கவும்.",
  "Recent surveys": "சமீபத்திய கணக்கெடுப்புகள்",
  "Your latest survey activity": "உங்கள் சமீபத்திய கணக்கெடுப்பு செயல்பாடு",
  "Quick actions": "விரைவு செயல்கள்",
  "Common field collection tasks": "பொதுவான வயல் தரவு சேகரிப்பு பணிகள்",
  "View all": "அனைத்தையும் பார்க்கவும்",
  "Register a new farmer": "புதிய விவசாயியைப் பதிவு செய்யவும்",
  "Register a farmer's field": "விவசாயியின் வயலைப் பதிவு செய்யவும்",
  "Continue incomplete surveys": "முடிக்கப்படாத கணக்கெடுப்புகளைத் தொடரவும்",
  "Farmer records, registered fields and survey collection": "விவசாயி பதிவுகள், பதிவு செய்யப்பட்ட வயல்கள் மற்றும் கணக்கெடுப்பு சேகரிப்பு",
  "Field Survey Dashboard": "வயல் கணக்கெடுப்பு டாஷ்போர்டு",
  "Latest collection activity from the field team": "வயல் குழுவின் சமீபத்திய தரவு சேகரிப்பு செயல்பாடு",
  "Stay productive even with limited connectivity.": "குறைந்த இணைய இணைப்பிலும் தொடர்ந்து செயல்படுங்கள்.",
  "Your field team can continue collecting and synchronize when connectivity returns.": "இணைப்பு திரும்பியதும் உங்கள் வயல் குழு தொடர்ந்து தரவைச் சேகரித்து ஒத்திசைக்கலாம்.",
  "Designed for real-world data collection.": "நிஜ உலக தரவு சேகரிப்பிற்காக வடிவமைக்கப்பட்டது.",
  "Field collection workflow": "வயல் தரவு சேகரிப்பு பணிப்பாய்வு",
  "Collection status": "சேகரிப்பு நிலை",
  "Recent field activity": "சமீபத்திய வயல் செயல்பாடு",
  "Survey Progress": "கணக்கெடுப்பு முன்னேற்றம்",
  "Survey progress": "கணக்கெடுப்பு முன்னேற்றம்",
  "Back to Dashboard": "டாஷ்போர்டுக்குத் திரும்பு",
  "View your AgriOrbit account information and access settings.": "உங்கள் AgriOrbit கணக்கு தகவல்களையும் அணுகல் அமைப்புகளையும் பார்க்கவும்.",
  "Active account": "செயலில் உள்ள கணக்கு",
  "Information associated with your AgriOrbit account.": "உங்கள் AgriOrbit கணக்குடன் தொடர்புடைய தகவல்கள்.",
  "Security": "பாதுகாப்பு",
  "Manage your account password securely.": "உங்கள் கணக்கு கடவுச்சொல்லை பாதுகாப்பாக நிர்வகிக்கவும்.",
  "Profile information": "சுயவிவரத் தகவல்",
  "Sign in to AgriOrbit using your account credentials.": "உங்கள் கணக்கு விவரங்களைப் பயன்படுத்தி AgriOrbit-ல் உள்நுழையவும்.",
  "Forgot your password?": "உங்கள் கடவுச்சொல்லை மறந்துவிட்டீர்களா?",
  "Your account access is determined by the role assigned to it.": "உங்கள் கணக்கு அணுகல் அதற்கு ஒதுக்கப்பட்ட பங்கின் அடிப்படையில் தீர்மானிக்கப்படுகிறது.",
  "System Administration": "கணினி நிர்வாகம்",
  "System Management": "கணினி மேலாண்மை",
  "Survey Management": "கணக்கெடுப்பு மேலாண்மை",
  "Loading farmers...": "விவசாயிகள் ஏற்றப்படுகின்றனர்...",
  "Loading fields...": "வயல்கள் ஏற்றப்படுகின்றன...",
  "Loading surveys...": "கணக்கெடுப்புகள் ஏற்றப்படுகின்றன...",
  "Loading drafts...": "வரைவுகள் ஏற்றப்படுகின்றன...",
  "Unable to load surveys": "கணக்கெடுப்புகளை ஏற்ற முடியவில்லை",
  "No offline drafts": "ஆஃப்லைன் வரைவுகள் இல்லை",
  "Syncing...": "ஒத்திசைக்கப்படுகிறது...",
  "Sync": "ஒத்திசை",
  "Survey submitted": "கணக்கெடுப்பு சமர்ப்பிக்கப்பட்டது",
  "Saved sections": "சேமிக்கப்பட்ட பிரிவுகள்",
  "Total Surveys": "மொத்த கணக்கெடுப்புகள்",
  "Total Fields": "மொத்த வயல்கள்",
  "GPS Captured": "GPS பதிவு செய்யப்பட்டது",
  "Farmer unavailable": "விவசாயி கிடைக்கவில்லை",
  "Field unavailable": "வயல் கிடைக்கவில்லை",
  "Enumerator unavailable": "கணக்கெடுப்பாளர் கிடைக்கவில்லை",
  "Not captured": "பதிவு செய்யப்படவில்லை",
  "Visit Date": "வருகை தேதி",
  "You are offline": "நீங்கள் ஆஃப்லைனில் உள்ளீர்கள்",
  "Start Survey": "கணக்கெடுப்பைத் தொடங்கு",
  "Start New Survey": "புதிய கணக்கெடுப்பைத் தொடங்கு",
  "Refresh": "புதுப்பி",
  "Select": "தேர்ந்தெடு",
  "Select...": "தேர்ந்தெடுக்கவும்...",
  "Select option": "விருப்பத்தைத் தேர்ந்தெடுக்கவும்",
  "Select an option": "ஒரு விருப்பத்தைத் தேர்ந்தெடுக்கவும்",
  "Select unit": "அலகைத் தேர்ந்தெடுக்கவும்",
  "Select ownership": "உரிமையைத் தேர்ந்தெடுக்கவும்",
  "Select land type": "நில வகையைத் தேர்ந்தெடுக்கவும்",
  "Select condition": "நிலையைத் தேர்ந்தெடுக்கவும்",
  "Select access": "அணுகலைத் தேர்ந்தெடுக்கவும்",
  "Don't know": "தெரியவில்லை",
  "Prefer not to say": "தெரிவிக்க விரும்பவில்லை",
  "Male": "ஆண்",
  "Female": "பெண்",
  "Own": "சொந்தம்",
  "Lease": "குத்தகை",
  "Owned": "சொந்தமானது",
  "Leased": "குத்தகைக்கு எடுத்தது",
  "Shared": "பகிரப்பட்டது",
  "Full-time": "முழுநேரம்",
  "Part-time": "பகுதிநேரம்",
  "Easy": "எளிது",
  "Difficult": "கடினம்",
  "Low": "குறைவு",
  "Moderate": "மிதமானது",
  "Good": "நல்லது",
  "Poor": "மோசமானது",
  "Critical": "மிகவும் தீவிரம்",
  "Medium": "நடுத்தரம்",
  "High": "அதிகம்",
  "Farmer": "விவசாயி",
  "Field": "வயல்",
  "Survey": "கணக்கெடுப்பு",
  "Location": "இருப்பிடம்",
  "Enumerator": "கணக்கெடுப்பாளர்",
  "Intern": "இன்டர்ன்",
  "Latitude": "அட்சரேகை",
  "Longitude": "தீர்க்கரேகை",
  "Acre": "ஏக்கர்",
  "Cent": "சென்ட்",
  "Hectare": "ஹெக்டேர்",
  "Sq. Ft": "சதுர அடி",
  "Area Unit": "பரப்பளவு அலகு",
  "Field ID": "வயல் அடையாள எண்",
  "Field area": "வயல் பரப்பளவு",
  "Land Details": "நில விவரங்கள்",
  "Water & Access": "நீர் மற்றும் அணுகல்",
  "Land Type": "நில வகை",
  "Nearby Water Source": "அருகிலுள்ள நீர் ஆதாரம்",
  "Road / transport access": "சாலை / போக்குவரத்து அணுகல்",
  "Mobile number": "கைபேசி எண்",
  "Select age group": "வயது குழுவைத் தேர்ந்தெடுக்கவும்",
  "Select farming type": "விவசாய வகையைத் தேர்ந்தெடுக்கவும்",
  "Total agricultural land": "மொத்த வேளாண் நிலம்",
  "Number of fields": "வயல்களின் எண்ணிக்கை",
  "Main agricultural income source": "முக்கிய வேளாண் வருமான மூலம்",
  "Training / extension support": "பயிற்சி / விரிவாக்க ஆதரவு",
  "Usual farming information source": "வழக்கமான விவசாய தகவல் மூலம்",
  "Ease of access": "அணுகல் எளிமை",
  "Field Location": "வயல் இருப்பிடம்",
  "Land Ownership": "நில உரிமை",
  "Uploaded": "பதிவேற்றப்பட்டது",
  "View": "பார்",
  "Total": "மொத்தம்",
  "Today": "இன்று",
  "Entity": "உருப்படி",
  "Previous": "முந்தையது",
  "Mixed": "கலப்பு",
  "Lowland": "தாழ்நிலம்",
  "Upland": "மேட்டுநிலம்",
  "Garden land": "தோட்ட நிலம்",

  // Extended global UI coverage
  "FIELD DATA COLLECTION": "வயல் தரவு சேகரிப்பு",
  "Sign In": "உள்நுழைக",
  "Empower field surveys anywhere —": "எங்கும் வயல் கணக்கெடுப்புகளைச் செய்யுங்கள் —",
  "online or offline.": "ஆன்லைனிலோ ஆஃப்லைனிலோ.",
  "Collect farmer profiles, register agricultural fields, and submit surveys even when connectivity is unreliable. Data can be synchronized when the connection returns.": "இணைய இணைப்பு நம்பகமற்ற நிலையிலும் விவசாயி சுயவிவரங்களைச் சேகரித்து, வேளாண் வயல்களைப் பதிவு செய்து, கணக்கெடுப்புகளைச் சமர்ப்பிக்கலாம். இணைப்பு திரும்பியதும் தரவை ஒத்திசைக்கலாம்.",
  "Continue in Browser": "உலாவியில் தொடர்க",
  "Android-friendly PWA": "Android-க்கு ஏற்ற PWA",
  "Online + offline workflow": "ஆன்லைன் + ஆஃப்லைன் பணிப்பாய்வு",
  "Role-based access": "பங்கு அடிப்படையிலான அணுகல்",
  "agriorbit · field collection": "AgriOrbit · வயல் தரவு சேகரிப்பு",
  "FIELD DATA": "வயல் தரவு",
  "Offline ready": "ஆஃப்லைனுக்கு தயார்",
  "SYNCED": "ஒத்திசைக்கப்பட்டது",
  "A focused workflow for capturing reliable farmer, field and survey information without making the field process complicated.": "வயல் செயல்முறையை சிக்கலாக்காமல் நம்பகமான விவசாயி, வயல் மற்றும் கணக்கெடுப்பு தகவல்களைச் சேகரிக்க வடிவமைக்கப்பட்ட பணிப்பாய்வு.",
  "AgriOrbit · Farmer & Field Data Collection Platform": "AgriOrbit · விவசாயி மற்றும் வயல் தரவு சேகரிப்பு தளம்",
  "Intern Dashboard": "இன்டர்ன் டாஷ்போர்டு",
  "Please refresh the page and try again.": "பக்கத்தைப் புதுப்பித்து மீண்டும் முயற்சிக்கவும்.",
  "No surveys yet": "இன்னும் கணக்கெடுப்புகள் இல்லை",
  "Start your first survey to see activity here.": "செயல்பாட்டை இங்கே காண உங்கள் முதல் கணக்கெடுப்பைத் தொடங்குங்கள்.",
  "Draft Surveys": "வரைவு கணக்கெடுப்புகள்",
  "Collect reliable farmer, field, survey, photo, and agricultural data through one structured platform.": "ஒரே கட்டமைக்கப்பட்ட தளத்தின் மூலம் நம்பகமான விவசாயி, வயல், கணக்கெடுப்பு, புகைப்பட மற்றும் வேளாண் தரவைச் சேகரிக்கவும்.",
  "Farmer records": "விவசாயி பதிவுகள்",
  "Field information": "வயல் தகவல்",
  "Structured surveys": "கட்டமைக்கப்பட்ட கணக்கெடுப்புகள்",
  "Enter your email": "உங்கள் மின்னஞ்சலை உள்ளிடவும்",
  "Enter your password": "உங்கள் கடவுச்சொல்லை உள்ளிடவும்",
  "Forgot password?": "கடவுச்சொல்லை மறந்துவிட்டீர்களா?",
  "Signing in...": "உள்நுழைகிறது...",
  "Hide password": "கடவுச்சொல்லை மறை",
  "Show password": "கடவுச்சொல்லைக் காட்டு",
  "Your account profile could not be verified. Contact an administrator.": "உங்கள் கணக்கு சுயவிவரத்தைச் சரிபார்க்க முடியவில்லை. நிர்வாகியைத் தொடர்புகொள்ளவும்.",
  "Continue saved surveys or synchronize them when the internet connection is available.": "சேமிக்கப்பட்ட கணக்கெடுப்புகளைத் தொடரவும் அல்லது இணைய இணைப்பு கிடைக்கும்போது அவற்றை ஒத்திசைக்கவும்.",
  "Your saved survey data remains on this device. You can continue working on the survey and it will synchronize when the connection returns.": "நீங்கள் சேமித்த கணக்கெடுப்பு தரவு இந்த சாதனத்திலேயே இருக்கும். தொடர்ந்து பணியாற்றலாம்; இணைப்பு திரும்பியதும் அது ஒத்திசைக்கப்படும்.",
  "Surveys saved while working offline will appear here.": "ஆஃப்லைனில் பணியாற்றும்போது சேமிக்கப்பட்ட கணக்கெடுப்புகள் இங்கே தோன்றும்.",
  "This survey has reached the submission stage and cannot be continued.": "இந்த கணக்கெடுப்பு சமர்ப்பிப்பு நிலையை அடைந்துவிட்டது; இதைத் தொடர முடியாது.",
  "Some sections could not be synchronized.": "சில பிரிவுகளை ஒத்திசைக்க முடியவில்லை.",
  "Back to Farmers": "விவசாயிகளுக்குத் திரும்பு",
  "Farmer not found": "விவசாயியைக் கண்டறிய முடியவில்லை",
  "Farmer information": "விவசாயி தகவல்",
  "Current farmer and field overview": "தற்போதைய விவசாயி மற்றும் வயல் மேலோட்டம்",
  "Registered fields": "பதிவு செய்யப்பட்ட வயல்கள்",
  "Fields associated with this farmer": "இந்த விவசாயியுடன் தொடர்புடைய வயல்கள்",
  "Add field": "வயலைச் சேர்",
  "View field": "வயலைப் பார்",
  "No fields registered": "வயல்கள் எதுவும் பதிவு செய்யப்படவில்லை",
  "Add a field to start collecting field-level information for this farmer.": "இந்த விவசாயிக்கான வயல் தகவல்களைச் சேகரிக்க ஒரு வயலைச் சேர்க்கவும்.",
  "Add first field": "முதல் வயலைச் சேர்",
  "Survey history": "கணக்கெடுப்பு வரலாறு",
  "Previous field data collection records": "முந்தைய வயல் தரவு சேகரிப்பு பதிவுகள்",
  "No surveys recorded yet": "இன்னும் கணக்கெடுப்புகள் பதிவு செய்யப்படவில்லை",
  "Survey history will appear here after a survey is recorded for this farmer.": "இந்த விவசாயிக்கான கணக்கெடுப்பு பதிவு செய்யப்பட்ட பிறகு கணக்கெடுப்பு வரலாறு இங்கே தோன்றும்.",
  "Farmer record": "விவசாயி பதிவு",
  "All information shown here is collected through field surveys.": "இங்கே காட்டப்படும் அனைத்து தகவல்களும் வயல் கணக்கெடுப்புகள் மூலம் சேகரிக்கப்பட்டவை.",
  "Farmer Registration": "விவசாயி பதிவு",
  "Register a farmer before collecting field and survey information.": "வயல் மற்றும் கணக்கெடுப்பு தகவல்களைச் சேகரிப்பதற்கு முன் விவசாயியைப் பதிவு செய்யவும்.",
  "Select gender": "பாலினத்தைத் தேர்ந்தெடுக்கவும்",
  "Below 25": "25 வயதுக்குக் கீழ்",
  "65 and above": "65 மற்றும் அதற்கு மேல்",
  "Administrative location of the farmer.": "விவசாயியின் நிர்வாக இருப்பிடத் தகவல்.",
  "Enter the 6-digit postal PIN code.": "6 இலக்க அஞ்சல் PIN குறியீட்டை உள்ளிடவும்.",
  "Farming Profile": "விவசாய சுயவிவரம்",
  "Select source": "மூலத்தைத் தேர்ந்தெடுக்கவும்",
  "Other farmers": "பிற விவசாயிகள்",
  "Agriculture department": "வேளாண்மைத் துறை",
  "Agriculture officer": "வேளாண்மை அலுவலர்",
  "Input dealer": "இடுபொருள் விற்பனையாளர்",
  "Family members": "குடும்ப உறுப்பினர்கள்",
  "Search and manage farmers registered by your field team.": "உங்கள் வயல் குழுவால் பதிவு செய்யப்பட்ட விவசாயிகளைத் தேடி நிர்வகிக்கவும்.",
  "Last Survey": "கடைசி கணக்கெடுப்பு",
  "Fetching farmer records from Supabase.": "Supabase-லிருந்து விவசாயி பதிவுகள் பெறப்படுகின்றன.",
  "No farmers found": "விவசாயிகள் எவரும் இல்லை",
  "Field Registration": "வயல் பதிவு",
  "Register a field and associate it with an existing farmer.": "ஒரு வயலைப் பதிவு செய்து ஏற்கனவே உள்ள விவசாயியுடன் இணைக்கவும்.",
  "Select the farmer and provide the field name.": "விவசாயியைத் தேர்ந்தெடுத்து வயல் பெயரை வழங்கவும்.",
  "Capture the field location when available.": "கிடைக்கும்போது வயல் இருப்பிடத்தைப் பதிவு செய்யவும்.",
  "Basic physical and ownership details of the field.": "வயலின் அடிப்படை உடல் மற்றும் உரிமை விவரங்கள்.",
  "Nearby water source and field accessibility.": "அருகிலுள்ள நீர் ஆதாரம் மற்றும் வயல் அணுகல் தகவல்கள்.",
  "Fetching field records from Supabase.": "Supabase-லிருந்து வயல் பதிவுகள் பெறப்படுகின்றன.",
  "No fields found": "வயல்கள் எதுவும் இல்லை",
  "Field Details": "வயல் விவரங்கள்",
  "Field Information": "வயல் தகவல்",
  "Update the basic information recorded for this field.": "இந்த வயலுக்காக பதிவு செய்யப்பட்ட அடிப்படை தகவல்களைப் புதுப்பிக்கவும்.",
  "Field ID cannot be changed.": "வயல் அடையாள எண்ணை மாற்ற முடியாது.",
  "Update GPS coordinates and boundary information.": "GPS ஆயத்தொலைவுகள் மற்றும் எல்லைத் தகவல்களைப் புதுப்பிக்கவும்.",
  "Mark this when the field boundary has been captured.": "வயல் எல்லை பதிவு செய்யப்பட்டதும் இதைக் குறிக்கவும்.",
  "Update physical and ownership information.": "உடல் மற்றும் உரிமைத் தகவல்களைப் புதுப்பிக்கவும்.",
  "Select access condition": "அணுகல் நிலையைத் தேர்ந்தெடுக்கவும்",
  "Select road access": "சாலை அணுகலைத் தேர்ந்தெடுக்கவும்",
  "No road access": "சாலை அணுகல் இல்லை",
  "No special features recorded.": "சிறப்பு அம்சங்கள் எதுவும் பதிவு செய்யப்படவில்லை.",
  "Field not found.": "வயலைக் கண்டறிய முடியவில்லை.",
  "Loading field...": "வயல் ஏற்றப்படுகிறது...",
  "Fetching field information from Supabase.": "Supabase-லிருந்து வயல் தகவல்கள் பெறப்படுகின்றன.",
  "Manage administrator accounts and system-level access.": "நிர்வாகி கணக்குகள் மற்றும் கணினி அளவிலான அணுகலை நிர்வகிக்கவும்.",
  "Access hierarchy": "அணுகல் படிநிலை",
  "AgriOrbit uses a three-level account hierarchy.": "AgriOrbit மூன்று நிலை கணக்கு படிநிலையைப் பயன்படுத்துகிறது.",
  "Creates and manages Admin accounts and has system-level access.": "நிர்வாகி கணக்குகளை உருவாக்கி நிர்வகிப்பதுடன் கணினி அளவிலான அணுகலையும் கொண்டுள்ளது.",
  "Manages interns, surveys, farmers, fields and operational data.": "இன்டர்ன்கள், கணக்கெடுப்புகள், விவசாயிகள், வயல்கள் மற்றும் செயல்பாட்டுத் தரவை நிர்வகிக்கிறது.",
  "Collects and submits farmer and field survey information.": "விவசாயி மற்றும் வயல் கணக்கெடுப்பு தகவல்களைச் சேகரித்து சமர்ப்பிக்கிறது.",
  "Only Super Admins can create or manage administrator accounts. Administrators can create Intern accounts but cannot create other Administrator accounts.": "முதன்மை நிர்வாகிகள் மட்டுமே நிர்வாகி கணக்குகளை உருவாக்க அல்லது நிர்வகிக்க முடியும். நிர்வாகிகள் இன்டர்ன் கணக்குகளை உருவாக்கலாம்; மற்ற நிர்வாகி கணக்குகளை உருவாக்க முடியாது.",
  "No administrator accounts": "நிர்வாகி கணக்குகள் எதுவும் இல்லை",
  "Create the first Admin account using the button above.": "மேலுள்ள பொத்தானைப் பயன்படுத்தி முதல் நிர்வாகி கணக்கை உருவாக்கவும்.",
  "Overview of your AgriOrbit data collection system.": "உங்கள் AgriOrbit தரவு சேகரிப்பு அமைப்பின் மேலோட்டம்.",
  "Manage Admins": "நிர்வாகிகளை நிர்வகிக்கவும்",
  "Manage collected surveys and survey configuration.": "சேகரிக்கப்பட்ட கணக்கெடுப்புகள் மற்றும் கணக்கெடுப்பு அமைப்புகளை நிர்வகிக்கவும்.",
  "View Surveys": "கணக்கெடுப்புகளைப் பார்க்கவும்",
  "Review submitted survey data": "சமர்ப்பிக்கப்பட்ட கணக்கெடுப்பு தரவை மதிப்பாய்வு செய்யவும்",
  "Configure survey questions and sections": "கணக்கெடுப்பு கேள்விகள் மற்றும் பிரிவுகளை அமைக்கவும்",
  "Manage users and system activity.": "பயனர்கள் மற்றும் கணினி செயல்பாடுகளை நிர்வகிக்கவும்.",
  "Manage intern accounts and permissions": "இன்டர்ன் கணக்குகள் மற்றும் அனுமதிகளை நிர்வகிக்கவும்",
  "Create and manage admin accounts": "நிர்வாகி கணக்குகளை உருவாக்கி நிர்வகிக்கவும்",
  "Manage Intern accounts and their access status.": "இன்டர்ன் கணக்குகள் மற்றும் அவற்றின் அணுகல் நிலையை நிர்வகிக்கவும்.",
  "Unable to load Intern accounts.": "இன்டர்ன் கணக்குகளை ஏற்ற முடியவில்லை.",
  "Total Interns": "மொத்த இன்டர்ன்கள்",
  "Inactive Interns": "செயலற்ற இன்டர்ன்கள்",
  "Field enumerator accounts created by Admins.": "நிர்வாகிகள் உருவாக்கிய வயல் கணக்கெடுப்பாளர் கணக்குகள்.",
  "Intern role": "இன்டர்ன் பங்கு",
  "No Intern accounts yet": "இன்னும் இன்டர்ன் கணக்குகள் இல்லை",
  "Create an Intern account to allow a field enumerator to sign in and collect survey data.": "வயல் கணக்கெடுப்பாளர் உள்நுழைந்து கணக்கெடுப்பு தரவைச் சேகரிக்க இன்டர்ன் கணக்கை உருவாக்கவும்.",
  "Unable to load account count": "கணக்கு எண்ணிக்கையை ஏற்ற முடியவில்லை",
  "View and manage field records registered by your field team.": "உங்கள் வயல் குழுவால் பதிவு செய்யப்பட்ட வயல் பதிவுகளைப் பார்த்து நிர்வகிக்கவும்.",
  "Unknown farmer": "தெரியாத விவசாயி",
  "Type not specified": "வகை குறிப்பிடப்படவில்லை",
  "Ownership not specified": "உரிமை குறிப்பிடப்படவில்லை",
  "Area —": "பரப்பளவு —",
  "Not specified": "குறிப்பிடப்படவில்லை",
  "Try searching with a different field name, field ID, farmer, village or district.": "வேறு வயல் பெயர், வயல் அடையாள எண், விவசாயி, கிராமம் அல்லது மாவட்டத்தைப் பயன்படுத்தி தேடவும்.",
  "No fields have been registered yet.": "இன்னும் வயல்கள் எதுவும் பதிவு செய்யப்படவில்லை.",
  "Your account details are managed through the AgriOrbit administration system. Contact your administrator if your employee information needs to be changed.": "உங்கள் கணக்கு விவரங்கள் AgriOrbit நிர்வாக அமைப்பின் மூலம் நிர்வகிக்கப்படுகின்றன. பணியாளர் தகவலை மாற்ற வேண்டுமெனில் உங்கள் நிர்வாகியைத் தொடர்புகொள்ளவும்.",
  "Reset your password": "உங்கள் கடவுச்சொல்லை மீட்டமைக்கவும்",
  "Verifying your recovery link...": "உங்கள் மீட்பு இணைப்பு சரிபார்க்கப்படுகிறது...",
  "Request a new link": "புதிய இணைப்பைக் கோரவும்",
  "New password": "புதிய கடவுச்சொல்",
  "Updating password...": "கடவுச்சொல் புதுப்பிக்கப்படுகிறது...",
  "Update password": "கடவுச்சொல்லைப் புதுப்பிக்கவும்",
  "Survey templates": "கணக்கெடுப்பு வார்ப்புருக்கள்",
  "Refresh templates": "வார்ப்புருக்களைப் புதுப்பிக்கவும்",
  "No templates yet. Create your first one below.": "இன்னும் வார்ப்புருக்கள் இல்லை. கீழே உங்கள் முதல் வார்ப்புருவை உருவாக்கவும்.",
  "Create template": "வார்ப்புருவை உருவாக்கவும்",
  "Name": "பெயர்",
  "Select or create a template": "வார்ப்புருவைத் தேர்ந்தெடுக்கவும் அல்லது உருவாக்கவும்",
  "Your sections and questions will appear here.": "உங்கள் பிரிவுகள் மற்றும் கேள்விகள் இங்கே தோன்றும்.",
  "New draft": "புதிய வரைவு",
  "Save draft": "வரைவைச் சேமிக்கவும்",
  "Publish version": "பதிப்பை வெளியிடவும்",
  "Published versions are read-only. Create a new draft to make further changes.": "வெளியிடப்பட்ட பதிப்புகளை மட்டும் படிக்க முடியும். மேலும் மாற்றங்களுக்கு புதிய வரைவை உருவாக்கவும்.",
  "Delete section": "பிரிவை நீக்கு",
  "Section title": "பிரிவு தலைப்பு",
  "Question label": "கேள்வி லேபிள்",
  "Answer type": "பதில் வகை",
  "Required question": "கட்டாய கேள்வி",
  "Options": "விருப்பங்கள்",
  "This template has no sections yet.": "இந்த வார்ப்புருவில் இன்னும் பிரிவுகள் இல்லை.",
  "Create first section": "முதல் பிரிவை உருவாக்கவும்",
  "Short text": "குறுகிய உரை",
  "Long text": "நீண்ட உரை",
  "Number": "எண்",
  "Dropdown": "கீழ்தோன்றும் பட்டியல்",
  "Multiple choice": "பல தேர்வு",
  "Yes / No": "ஆம் / இல்லை",
  "New question": "புதிய கேள்வி",
  "New section": "புதிய பிரிவு",
  "Working…": "செயல்படுகிறது…",
  "Please record a voice response first.": "முதலில் குரல் பதிலைப் பதிவு செய்யவும்.",
  "Voice Recording": "குரல் பதிவு",
  "Voice recording is not supported by this browser.": "இந்த உலாவியில் குரல் பதிவு ஆதரிக்கப்படவில்லை.",
  "Photo": "புகைப்படம்",
  "Capture a clear photo.": "தெளிவான புகைப்படத்தை எடுக்கவும்.",
  "Please select an image file.": "படக் கோப்பைத் தேர்ந்தெடுக்கவும்.",
  "Photo size must be less than 10 MB.": "புகைப்பட அளவு 10 MB-க்கு குறைவாக இருக்க வேண்டும்.",
  "Please select a photo first.": "முதலில் ஒரு புகைப்படத்தைத் தேர்ந்தெடுக்கவும்.",
  "Remove selected photo": "தேர்ந்தெடுத்த புகைப்படத்தை அகற்றவும்",
  "Photo uploaded successfully.": "புகைப்படம் வெற்றிகரமாக பதிவேற்றப்பட்டது.",
  "Unable to upload the photo.": "புகைப்படத்தைப் பதிவேற்ற முடியவில்லை.",
  "Unable to save photo offline:": "புகைப்படத்தை ஆஃப்லைனில் சேமிக்க முடியவில்லை:",
  "Voice recording uploaded successfully.": "குரல் பதிவு வெற்றிகரமாக பதிவேற்றப்பட்டது.",
  "Unable to upload the voice recording.": "குரல் பதிவைப் பதிவேற்ற முடியவில்லை.",
  "Unable to save voice recording offline:": "குரல் பதிவை ஆஃப்லைனில் சேமிக்க முடியவில்லை:",
  "Critical notice": "மிகவும் முக்கியமான அறிவிப்பு",
  "Important notice": "முக்கியமான அறிவிப்பு",
  "Information": "தகவல்",
  "Maintenance announcements": "பராமரிப்பு அறிவிப்புகள்",
  "Unable to load maintenance announcements:": "பராமரிப்பு அறிவிப்புகளை ஏற்ற முடியவில்லை:",
  "Unexpected error loading maintenance announcements:": "பராமரிப்பு அறிவிப்புகளை ஏற்றும்போது எதிர்பாராத பிழை ஏற்பட்டது:",
  "Open menu": "மெனுவைத் திறக்கவும்",
  "Close menu": "மெனுவை மூடவும்",
  "Super Admin Portal": "முதன்மை நிர்வாகி தளம்",
  "No employee ID": "பணியாளர் அடையாள எண் இல்லை",
  "User": "பயனர்",
  "Signing out...": "வெளியேறுகிறது...",
  "Survey Section D": "கணக்கெடுப்பு பிரிவு D",
  "Survey Section E": "கணக்கெடுப்பு பிரிவு E",
  "Survey Section F": "கணக்கெடுப்பு பிரிவு F",
  "Survey Section G": "கணக்கெடுப்பு பிரிவு G",
  "Survey Section H": "கணக்கெடுப்பு பிரிவு H",
  "Survey Section I": "கணக்கெடுப்பு பிரிவு I",
  "Survey Section J": "கணக்கெடுப்பு பிரிவு J",
  "Survey Section K": "கணக்கெடுப்பு பிரிவு K",
  "Survey Section L": "கணக்கெடுப்பு பிரிவு L",
  "Survey Section M": "கணக்கெடுப்பு பிரிவு M",
  "Survey Section N": "கணக்கெடுப்பு பிரிவு N",
  "Survey Section O": "கணக்கெடுப்பு பிரிவு O",
  "Survey Section P": "கணக்கெடுப்பு பிரிவு P",
  "Section F": "பிரிவு F",
  "Section G": "பிரிவு G",
  "Section H": "பிரிவு H",
  "Section I": "பிரிவு I",
  "Section J": "பிரிவு J",
  "Section K": "பிரிவு K",
  "Section L": "பிரிவு L",
  "Section M": "பிரிவு M",
  "Section N": "பிரிவு N",
  "Section O": "பிரிவு O",
  "Section P": "பிரிவு P",
  "Excellent": "மிகச் சிறந்தது",
  "Very satisfied": "மிகவும் திருப்தி",
  "Satisfied": "திருப்தி",
  "Neutral": "நடுநிலை",
  "Dissatisfied": "திருப்தியில்லை",
  "Very dissatisfied": "மிகவும் திருப்தியில்லை",
  "Local trader": "உள்ளூர் வியாபாரி",
  "Wholesale": "மொத்த விற்பனை",
  "Kilometres": "கிலோமீட்டர்",
  "Miles": "மைல்",
  "Sometimes": "சில நேரங்களில்",
  "Limited": "வரையறுக்கப்பட்டது",
  "Family labour": "குடும்பத் தொழிலாளர்",
  "Hired labour": "கூலி தொழிலாளர்",
  "Both family and hired": "குடும்ப மற்றும் கூலி தொழிலாளர் இரண்டும்",
  "Rarely": "அரிதாக",
  "Occasionally": "அவ்வப்போது",
  "Monthly": "மாதந்தோறும்",
  "Seasonally": "பருவந்தோறும்",
  "Frequently": "அடிக்கடி",
  "Survey Summary": "கணக்கெடுப்பு சுருக்கம்",
  "Section checklist": "பிரிவு சரிபார்ப்புப் பட்டியல்",
  "Select a completed section to review or edit it.": "முடிக்கப்பட்ட பிரிவைத் தேர்ந்தெடுத்து மதிப்பாய்வு செய்யவும் அல்லது திருத்தவும்.",
  "Save as Draft": "வரைவாகச் சேமிக்கவும்",
  "Review all sections before submitting the survey.": "கணக்கெடுப்பைச் சமர்ப்பிக்கும் முன் அனைத்து பிரிவுகளையும் மதிப்பாய்வு செய்யவும்.",
  "Selected farmer": "தேர்ந்தெடுக்கப்பட்ட விவசாயி",
  "Selected field": "தேர்ந்தெடுக்கப்பட்ட வயல்",
  "Survey setup": "கணக்கெடுப்பு அமைப்பு",
  "Starting Survey...": "கணக்கெடுப்பு தொடங்கப்படுகிறது...",
  "This will create a new draft survey linked to the selected farmer and field.": "தேர்ந்தெடுக்கப்பட்ட விவசாயி மற்றும் வயலுடன் இணைக்கப்பட்ட புதிய வரைவு கணக்கெடுப்பு உருவாக்கப்படும்.",
  "This survey will be stored on this device first and synchronized when the connection returns.": "இந்த கணக்கெடுப்பு முதலில் இந்த சாதனத்தில் சேமிக்கப்படும்; இணைப்பு திரும்பியதும் ஒத்திசைக்கப்படும்.",
  "Offline note:": "ஆஃப்லைன் குறிப்பு:",
  "Submitted Surveys": "சமர்ப்பிக்கப்பட்ட கணக்கெடுப்புகள்",
  "Registered farmers": "பதிவு செய்யப்பட்ட விவசாயிகள்",
  "Collected surveys": "சேகரிக்கப்பட்ட கணக்கெடுப்புகள்",
  "Surveys awaiting submission": "சமர்ப்பிக்க காத்திருக்கும் கணக்கெடுப்புகள்",
  "Audit records could not be loaded. Please try again later.": "தணிக்கை பதிவுகளை ஏற்ற முடியவில்லை. பின்னர் மீண்டும் முயற்சிக்கவும்.",
  "Could not initialize the Survey Builder.": "கணக்கெடுப்பு உருவாக்கியைத் தொடங்க முடியவில்லை.",
  "Could not load this template.": "இந்த வார்ப்புருவை ஏற்ற முடியவில்லை.",
  "Enter a survey template name first.": "முதலில் கணக்கெடுப்பு வார்ப்புரு பெயரை உள்ளிடவும்.",
  "Template created. Add sections and questions.": "வார்ப்புரு உருவாக்கப்பட்டது. பிரிவுகள் மற்றும் கேள்விகளைச் சேர்க்கவும்.",
  "Could not create the template.": "வார்ப்புருவை உருவாக்க முடியவில்லை.",
  "You are already editing a draft.": "நீங்கள் ஏற்கனவே ஒரு வரைவைத் திருத்திக்கொண்டிருக்கிறீர்கள்.",
  "Your session has expired.": "உங்கள் அமர்வு காலாவதியாகிவிட்டது.",
  "Opened the existing draft.": "ஏற்கனவே உள்ள வரைவு திறக்கப்பட்டது.",
  "Could not create a new draft.": "புதிய வரைவை உருவாக்க முடியவில்லை.",
  "Published versions are read-only. Start a new draft to edit.": "வெளியிடப்பட்ட பதிப்புகளைத் திருத்த முடியாது. திருத்த புதிய வரைவைத் தொடங்கவும்.",
  "Draft saved successfully.": "வரைவு வெற்றிகரமாகச் சேமிக்கப்பட்டது.",
  "Could not save the draft.": "வரைவைச் சேமிக்க முடியவில்லை.",
  "Create a new draft before publishing changes.": "மாற்றங்களை வெளியிடுவதற்கு முன் புதிய வரைவை உருவாக்கவும்.",
  "Add at least one section before publishing.": "வெளியிடுவதற்கு முன் குறைந்தது ஒரு பிரிவையாவது சேர்க்கவும்.",
  "Every section needs a title.": "ஒவ்வொரு பிரிவுக்கும் தலைப்பு தேவை.",
  "Every question needs a label.": "ஒவ்வொரு கேள்விக்கும் லேபிள் தேவை.",
  "Could not publish this version.": "இந்த பதிப்பை வெளியிட முடியவில்லை.",
  "Delete this section and all its questions?": "இந்தப் பிரிவையும் அதன் அனைத்து கேள்விகளையும் நீக்கவா?",
  "Move section up": "பிரிவை மேலே நகர்த்தவும்",
  "Move section down": "பிரிவை கீழே நகர்த்தவும்",
  "Remove option": "விருப்பத்தை அகற்றவும்",
  "+ Add option": "+ விருப்பத்தைச் சேர்க்கவும்",
  "+ Add question": "+ கேள்வியைச் சேர்க்கவும்",
  "+ Add section": "+ பிரிவைச் சேர்க்கவும்",
  "Create a new field survey": "புதிய வயல் கணக்கெடுப்பை உருவாக்கவும்",
  "Capture the device location for this survey visit.": "இந்த கணக்கெடுப்பு வருகைக்கான சாதன இருப்பிடத்தைப் பதிவு செய்யவும்.",
  "GPS status": "GPS நிலை",
  "Enumerator name": "கணக்கெடுப்பாளர் பெயர்",
  "Visit date": "வருகை தேதி",
  "Visit time": "வருகை நேரம்",
  "Information provider": "தகவல் வழங்குபவர்",
  "Select information provider": "தகவல் வழங்குபவரைத் தேர்ந்தெடுக்கவும்",
  "Family member": "குடும்ப உறுப்பினர்",
  "Continue to Section B": "பிரிவு B-க்கு தொடர்க",
  "Back to Section A": "பிரிவு A-க்குத் திரும்பு",
  "Back to Section B": "பிரிவு B-க்குத் திரும்பு",
  "Back to Section C": "பிரிவு C-க்குத் திரும்பு",
  "Back to Section D": "பிரிவு D-க்குத் திரும்பு",
  "Back to Section E": "பிரிவு E-க்குத் திரும்பு",
  "Back to Section F": "பிரிவு F-க்குத் திரும்பு",
  "Back to Section G": "பிரிவு G-க்குத் திரும்பு",
  "Back to Section H": "பிரிவு H-க்குத் திரும்பு",
  "Back to Section I": "பிரிவு I-க்குத் திரும்பு",
  "Back to Section J": "பிரிவு J-க்குத் திரும்பு",
  "Back to Section K": "பிரிவு K-க்குத் திரும்பு",
  "Back to Section L": "பிரிவு L-க்குத் திரும்பு",
  "Back to Section M": "பிரிவு M-க்குத் திரும்பு",
  "Back to Section N": "பிரிவு N-க்குத் திரும்பு",
  "Back to Section O": "பிரிவு O-க்குத் திரும்பு",
  "Loading survey...": "கணக்கெடுப்பு ஏற்றப்படுகிறது...",
  "Loading farmer profile...": "விவசாயி சுயவிவரம் ஏற்றப்படுகிறது...",
  "Loading field details...": "வயல் விவரங்கள் ஏற்றப்படுகின்றன...",
  "Loading soil details...": "மண் விவரங்கள் ஏற்றப்படுகின்றன...",
  "Loading crop details...": "பயிர் விவரங்கள் ஏற்றப்படுகின்றன...",
  "Loading seed information...": "விதை தகவல்கள் ஏற்றப்படுகின்றன...",
  "Loading input information...": "இடுபொருள் தகவல்கள் ஏற்றப்படுகின்றன...",
  "Loading water and irrigation information...": "நீர் மற்றும் பாசன தகவல்கள் ஏற்றப்படுகின்றன...",
  "Loading crop problems...": "பயிர் பிரச்சினைகள் ஏற்றப்படுகின்றன...",
  "Loading Section J...": "பிரிவு J ஏற்றப்படுகிறது...",
  "Loading Section K...": "பிரிவு K ஏற்றப்படுகிறது...",
  "Loading market information...": "சந்தை தகவல்கள் ஏற்றப்படுகின்றன...",
  "Loading labour information...": "தொழிலாளர் தகவல்கள் ஏற்றப்படுகின்றன...",
  "Loading farmer knowledge...": "விவசாயி அறிவுத் தகவல்கள் ஏற்றப்படுகின்றன...",
  "Loading Survey O...": "கணக்கெடுப்பு O ஏற்றப்படுகிறது...",
  "Loading final review...": "இறுதி மதிப்பாய்வு ஏற்றப்படுகிறது...",
  "Record the basic details of this field visit.": "இந்த வயல் வருகையின் அடிப்படை விவரங்களைப் பதிவு செய்யவும்.",
  "Record the soil characteristics and soil-related information for this field.": "இந்த வயலின் மண் பண்புகள் மற்றும் மண் தொடர்பான தகவல்களைப் பதிவு செய்யவும்.",
  "Record observations made directly during the field visit.": "வயல் வருகையின் போது நேரடியாகக் கவனிக்கப்பட்டவற்றைப் பதிவு செய்யவும்.",
  "Record the seed and variety information used by the farmer.": "விவசாயி பயன்படுத்திய விதை மற்றும் ரகத் தகவல்களைப் பதிவு செய்யவும்.",
  "Record whether the farmer is comfortable using rented farming equipment when needed.": "தேவைப்படும் போது வாடகை வேளாண் உபகரணங்களைப் பயன்படுத்த விவசாயி வசதியாக உள்ளாரா என்பதைப் பதிவு செய்யவும்.",
  "Record whether the farmer is willing to share their farming knowledge and experience.": "விவசாயி தனது விவசாய அறிவு மற்றும் அனுபவத்தைப் பகிர விரும்புகிறாரா என்பதைப் பதிவு செய்யவும்.",
  "Record whether the farmer is interested in each type of information or support.": "ஒவ்வொரு வகையான தகவல் அல்லது ஆதரவிலும் விவசாயி ஆர்வமாக உள்ளாரா என்பதைப் பதிவு செய்யவும்.",

  // Language control itself
  "English": "ஆங்கிலம்",
  "Tamil": "தமிழ்",
  "Language": "மொழி",
};

// Reverse lookup lets us recover English even for DOM nodes that were
// replaced by React while Tamil was active. User-entered input values are
// not modified by the DOM translator, so their content remains untouched.
const tamilToEnglish = Object.entries(translations).reduce<Record<string, string>>(
  (map, [english, tamil]) => {
    if (english !== tamil && !map[tamil]) map[tamil] = english;
    return map;
  },
  {}
);

const reverseEntries = Object.entries(tamilToEnglish)
  .filter(([tamil, english]) => tamil !== english && tamil.length >= 2)
  .sort(([a], [b]) => b.length - a.length);

function recoverEnglishText(value: string) {
  const normalized = normalizeText(value);
  if (tamilToEnglish[normalized]) return tamilToEnglish[normalized];

  let result = value;
  for (const [tamil, english] of reverseEntries) {
    if (result.includes(tamil)) {
      result = result.split(tamil).join(english);
    }
  }
  return result;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function translateText(value: string, language: AppLanguage) {
  if (language === "en") return value;

  const normalized = normalizeText(value);
  const exact = translations[normalized];
  if (exact) return exact;

  // Also translate known phrases inside dynamic text while preserving
  // user data such as a farmer's name.
  let result = value;
  const entries = Object.entries(translations)
    .filter(([english, tamil]) => english !== tamil && english.length >= 3)
    .sort(([a], [b]) => b.length - a.length);

  for (const [english, tamil] of entries) {
    if (result.includes(english)) {
      result = result.split(english).join(tamil);
    }
  }

  return result;
}

function shouldIgnoreElement(element: Element) {
  return (
    element.closest("[data-i18n-ignore='true']") !== null ||
    element.tagName === "SCRIPT" ||
    element.tagName === "STYLE" ||
    element.tagName === "NOSCRIPT" ||
    element.tagName === "TEXTAREA"
  );
}

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] = useState<AppLanguage>("en");

  // Keep the original English DOM content across language switches.
  // The previous implementation recreated these maps on every language
  // change, so Tamil text became the new "original" and switching back to
  // English required a full page reload.
  const originalTextRef = React.useRef<WeakMap<Text, string>>(new WeakMap());
  const originalAttrsRef = React.useRef<WeakMap<Element, Record<string, string>>>(
    new WeakMap()
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(
      "agriorbit-language"
    ) as AppLanguage | null;

    if (stored === "ta" || stored === "en") {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = useCallback((next: AppLanguage) => {
    setLanguageState(next);
    window.localStorage.setItem("agriorbit-language", next);
    document.documentElement.lang = next === "ta" ? "ta" : "en";
    window.dispatchEvent(
      new CustomEvent("agriorbit-language-change", {
        detail: next,
      })
    );
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "ta" : "en");
  }, [language, setLanguage]);

  useEffect(() => {
    document.documentElement.lang =
      language === "ta" ? "ta" : "en";

    const originalText = originalTextRef.current;
    const originalAttrs = originalAttrsRef.current;

    const textWalker = () => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT
      );

      let node: Node | null;

      while ((node = walker.nextNode())) {
        const textNode = node as Text;
        const parent = textNode.parentElement;

        if (!parent || shouldIgnoreElement(parent)) continue;

        const current = textNode.nodeValue ?? "";
        let raw = originalText.has(textNode)
          ? originalText.get(textNode)!
          : current;

        if (!originalText.has(textNode)) {
          // If React created this node while Tamil was active, recover its
          // English source from the translation dictionary when possible.
          if (language === "en") {
            raw = recoverEnglishText(current);
          }
          originalText.set(textNode, raw);
        }

        if (language === "en") {
          // Always restore the original English text.
          textNode.nodeValue = raw;
          continue;
        }

        const translated = translateText(raw, language);

        if (translated !== raw) {
          const leading = raw.match(/^\s*/)?.[0] ?? "";
          const trailing = raw.match(/\s*$/)?.[0] ?? "";
          textNode.nodeValue =
            leading + translated + trailing;
        } else {
          textNode.nodeValue = raw;
        }
      }
    };

    const translateAttributes = () => {
      const elements = document.querySelectorAll(
        "input, textarea, button, [aria-label], [title], [placeholder]"
      );

      elements.forEach((element) => {
        if (shouldIgnoreElement(element)) return;

        const attrs = [
          "placeholder",
          "title",
          "aria-label",
        ];

        const stored = originalAttrs.get(element) ?? {};

        attrs.forEach((attr) => {
          const current = element.getAttribute(attr);

          if (current !== null && !(attr in stored)) {
            stored[attr] = current;
          }

          const raw = stored[attr];

          if (!raw) return;

          element.setAttribute(
            attr,
            language === "ta"
              ? translateText(raw, language)
              : raw
          );
        });

        originalAttrs.set(element, stored);
      });
    };

    const apply = () => {
      textWalker();
      translateAttributes();
    };

    apply();

    const observer = new MutationObserver(() => {
      apply();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
    }),
    [language, setLanguage, toggleLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
      <LanguageToggle />
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}
