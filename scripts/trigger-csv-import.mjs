const csvText = `name,address,phone,email,website,description,category,city
McDonough Dental Care,125 Sabot Way McDonough GA,770-555-0210,info@mcdonoughdental.com,https://mcdonoughdental.com,Professional dental clinic offering comprehensive family oral care cosmetic whitening and implants.,medicals,mcdonough
Stockbridge Auto Repair & Diagnostics,480 North Henry Blvd Stockbridge GA,770-555-0220,service@stockbridgeauto.com,https://stockbridgeauto.com,Full service automotive repair facility specializing in engine diagnostics transmission overhauls and brake service.,automotive,stockbridge
Hampton Coffee Depot & Bakery,12 Cherry St Hampton GA,770-555-0230,hello@hamptoncoffee.com,https://hamptoncoffee.com,Cozy artisanal coffee shop serving locally roasted espresso blends house-baked breakfast pastries and Wi-Fi.,foods,hampton
Southern Classic BBQ & Smokehouse,85 Jonesboro Rd McDonough GA,770-555-0240,catering@southernclassicbbq.com,https://southernclassicbbq.com,Award-winning Georgia smoked meats hickory pulled pork slow-roasted ribs and homemade mac & cheese.,foods,mcdonough
Eagle's Landing Heating & Air,110 Rock Quarry Rd Stockbridge GA,770-555-0250,contact@eagleslandinghvac.com,https://eagleslandinghvac.com,Licensed 24/7 emergency HVAC repair air conditioning installation furnace maintenance and duct cleaning.,services,stockbridge
Henry County Wellness & Day Spa,210 Keys Ferry St McDonough GA,770-555-0260,relax@henrywellnessspa.com,https://henrywellnessspa.com,Luxury medical spa providing therapeutic deep tissue massages hydrafacials and body contouring.,beauty-spa,mcdonough
Locust Grove Animal Hospital,3850 Highway 42 Locust Grove GA,770-555-0270,care@locustgrovevet.com,https://locustgrovevet.com,Full-service veterinary clinic dedicated to small animal wellness exams surgical procedures and boarding.,medicals,locust-grove
Stockbridge Family Law & Mediation,150 Country Club Dr Stockbridge GA,770-555-0280,consult@stockbridgelawyers.com,https://stockbridgelawyers.com,Experienced legal representation for family law estate planning probate and civil mediation.,services,stockbridge
Locust Grove Hardware & Supply,3700 Highway 42 Locust Grove GA,770-555-0290,sales@locustgrovehardware.com,https://locustgrovehardware.com,Independent hardware store offering lawn equipment power tools plumbing fixtures and paint mixing.,shopping,locust-grove
Hampton Fitness 24/7 Gym,45 Main St Hampton GA,770-555-0300,fit@hamptonfitness247.com,https://hamptonfitness247.com,State-of-the-art 24 hour gym featuring cardio suites free weights group fitness classes and personal trainers.,fitness,hampton`;

async function importData() {
  console.log("🚀 Importing dummy businesses via /api/csv-import endpoint...");
  try {
    const res = await fetch("http://localhost:3000/api/csv-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csvText }),
    });
    const data = await res.json();
    console.log("Result:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

importData();
