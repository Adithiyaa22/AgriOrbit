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

  // Language control itself
  "English": "ஆங்கிலம்",
  "Tamil": "தமிழ்",
  "Language": "மொழி",
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function translateText(value: string, language: AppLanguage) {
  if (language === "en") return value;
  const normalized = normalizeText(value);
  return translations[normalized] ?? value;
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

    const originalText = new WeakMap<Text, string>();
    const originalAttrs = new WeakMap<Element, Record<string, string>>();

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

        const raw = originalText.has(textNode)
          ? originalText.get(textNode)!
          : textNode.nodeValue ?? "";

        if (!originalText.has(textNode)) {
          originalText.set(textNode, raw);
        }

        if (language === "en") {
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
