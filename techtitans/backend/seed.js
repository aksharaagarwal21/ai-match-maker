/**
 * TechTitans — Seed Script
 * Inserts 50+ dummy users, 15 projects, 120+ messages, and contributions.
 * Run: node seed.js
 */

require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const DB_CONFIG = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "Palak@123",
    database: process.env.DB_NAME || "techtitans",
    multipleStatements: true,
};

// ─── 52 Dummy Users ─────────────────────────────────────────────────────────
const USERS = [
    { name: "Dr. Ananya Sharma", email: "ananya@aiims.in", domain: "Medical Research", org: "AIIMS Delhi", skills: "Clinical Trials, Oncology, MRI Analysis", problem: "Early-stage cancer detection using non-invasive imaging techniques for rural clinics." },
    { name: "Aditya Verma", email: "aditya@iitb.ac.in", domain: "AI / Machine Learning", org: "IIT Bombay", skills: "Deep Learning, CNN, PyTorch, Medical Imaging", problem: "Applying computer vision to automate radiology report generation." },
    { name: "Dr. Priya Nair", email: "priya@tifr.res.in", domain: "Biotechnology", org: "TIFR Mumbai", skills: "Gene Editing, CRISPR, Protein Folding, Genomics", problem: "Using CRISPR to develop targeted therapies for rare genetic disorders." },
    { name: "Karan Mehta", email: "karan@iitd.ac.in", domain: "Robotics", org: "IIT Delhi", skills: "ROS, Computer Vision, Servo Control, Embedded Systems", problem: "Building autonomous surgical assistants for minimally invasive procedures." },
    { name: "Dr. Sunita Patel", email: "sunita@mayoclinic.org", domain: "Neuroscience", org: "Mayo Clinic", skills: "EEG, Brain-Computer Interface, Neural Signal Processing", problem: "Developing BCI devices to restore motor function in paralysis patients." },
    { name: "Rahul Gupta", email: "rahul@nvidia.com", domain: "AI / Machine Learning", org: "NVIDIA", skills: "CUDA, Transformer Models, Reinforcement Learning, LLMs", problem: "Accelerating drug molecule discovery using GPU-parallel ML models." },
    { name: "Dr. Meera Krishnan", email: "meera@iiscbangalore.in", domain: "Chemistry", org: "IISc Bangalore", skills: "Molecular Dynamics, Material Synthesis, Spectroscopy", problem: "Designing biodegradable polymers for targeted drug delivery systems." },
    { name: "Vijay Anand", email: "vijay@isro.gov.in", domain: "Aerospace", org: "ISRO", skills: "Orbital Mechanics, Propulsion, Systems Engineering, CAD", problem: "Reducing satellite manufacturing costs using 3D-printed components." },
    { name: "Dr. Fatima Sheikh", email: "fatima@who.int", domain: "Environmental Science", org: "WHO Geneva", skills: "Epidemiology, GIS Mapping, Public Health Analytics", problem: "Predictive modeling for outbreak detection in low-resource settings." },
    { name: "Arjun Reddy", email: "arjun@microsoft.com", domain: "Computer Science", org: "Microsoft Research", skills: "Cloud Computing, Distributed Systems, Kubernetes, Azure", problem: "Federated learning infrastructure for privacy-preserving medical AI." },
    { name: "Dr. Lata Goswami", email: "lata@narl.gov.in", domain: "Physics", org: "NARL", skills: "Atmospheric Physics, LIDAR, Remote Sensing", problem: "Using satellite LIDAR to monitor air quality in Tier-2 Indian cities." },
    { name: "Sneha Iyer", email: "sneha@flipkart.com", domain: "Finance / FinTech", org: "Flipkart", skills: "Blockchain, Smart Contracts, DeFi, Risk Modeling", problem: "Micro-insurance using blockchain for informal sector workers." },
    { name: "Dr. Rajesh Kapoor", email: "rajesh@pgimer.edu.in", domain: "Medical Research", org: "PGIMER Chandigarh", skills: "Cardiology, ECG Analysis, Heart Failure Prediction", problem: "AI-driven ECG interpretation for community health workers." },
    { name: "Nidhi Agarwal", email: "nidhi@iitkgp.ac.in", domain: "Materials Science", org: "IIT Kharagpur", skills: "Nanomaterials, Battery Technology, Electrochemistry", problem: "Develop solid-state batteries for faster-charging EVs." },
    { name: "Dr. Ashok Misra", email: "ashok@iipindia.org", domain: "Chemistry", org: "IIP Dehradun", skills: "Catalysis, Fuel Cells, Green Hydrogen", problem: "Green hydrogen from biomass for decentralized rural power." },
    { name: "Pooja Desai", email: "pooja@wipro.com", domain: "Computer Science", org: "Wipro AI Lab", skills: "NLP, Named Entity Recognition, RAG, LangChain", problem: "Multilingual AI assistant for government welfare scheme access." },
    { name: "Dr. Harish Babu", email: "harish@ncbs.res.in", domain: "Neuroscience", org: "NCBS Bangalore", skills: "Optogenetics, Synaptic Plasticity, Alzheimer Research", problem: "Early biomarkers for Alzheimer using retinal imaging." },
    { name: "Manish Tiwari", email: "manish@cognizant.com", domain: "AI / Machine Learning", org: "Cognizant AI", skills: "Time Series, LSTM, Anomaly Detection, MLOps", problem: "Predictive maintenance for manufacturing using IoT sensor data." },
    { name: "Dr. Gayatri Menon", email: "gayatri@icar.gov.in", domain: "Biotechnology", org: "ICAR", skills: "Plant Genomics, Precision Agriculture, Crop Yield Prediction", problem: "Drought-resistant crop development using CRISPR gene editing." },
    { name: "Siddharth Roy", email: "siddharth@tata.com", domain: "Mechanical Engineering", org: "Tata Motors R&D", skills: "FEA, CFD, Structural Analysis, Electric Drivetrain", problem: "Lightweight chassis design using topology optimization for EVs." },
    { name: "Dr. Vandana Rao", email: "vandana@nimhans.in", domain: "Neuroscience", org: "NIMHANS Bangalore", skills: "Psychiatry, Mental Health AI, fMRI Analysis", problem: "AI diagnosis tool for depression severity classification from speech patterns." },
    { name: "Amol Kulkarni", email: "amol@infosys.com", domain: "Computer Science", org: "Infosys R&D", skills: "Digital Twins, Simulation, Unity3D, IoT", problem: "Digital twin for real-time hospital resource optimization." },
    { name: "Dr. Sundar Pichai", email: "sundar@iitmadras.in", domain: "Environmental Science", org: "IIT Madras", skills: "Ocean Modelling, Climate Science, Carbon Capture", problem: "Coastal erosion prediction using ML and satellite data." },
    { name: "Kavya Srinivas", email: "kavya@amazon.in", domain: "Finance / FinTech", org: "Amazon India", skills: "Credit Scoring, Fraud Detection, Explainable AI", problem: "Fair credit scoring for gig economy workers without credit history." },
    { name: "Dr. Ramesh Chandra", email: "ramesh@barc.gov.in", domain: "Physics", org: "BARC Mumbai", skills: "Nuclear Physics, Radiation Therapy, Monte Carlo simulations", problem: "AI-guided proton beam targeting for brain tumor radiation therapy." },
    { name: "Deepika Nambiar", email: "deepika@zoho.com", domain: "Computer Science", org: "Zoho Corp", skills: "Graph Neural Networks, Knowledge Graphs, Recommendation Systems", problem: "Drug-drug interaction prediction using biomedical knowledge graphs." },
    { name: "Dr. Sanjay Mishra", email: "sanjay@nimb.gov.in", domain: "Biotechnology", org: "NIMB", skills: "Vaccine Development, Immunology, mRNA Technology", problem: "Rapid mRNA vaccine platform for emerging zoonotic diseases." },
    { name: "Nikhil Bhatt", email: "nikhil@iitroorkee.in", domain: "Civil Engineering", org: "IIT Roorkee", skills: "Structural Health Monitoring, Seismic Analysis, IoT Sensors", problem: "Real-time earthquake damage assessment for critical infrastructure." },
    { name: "Dr. Lalitha Suresh", email: "lalitha@cmfri.gov.in", domain: "Environmental Science", org: "CMFRI Kochi", skills: "Marine Biology, Ocean Acidification, Fisheries Management", problem: "Coral reef health monitoring using underwater drones and AI." },
    { name: "Rohit Joshi", email: "rohit@qualcomm.com", domain: "Mechanical Engineering", org: "Qualcomm R&D", skills: "MEMS, Chip Fabrication, Thermal Management", problem: "Ultra-low power biosensors for continuous patient monitoring." },
    { name: "Dr. Anita Sood", email: "anita@igib.res.in", domain: "Biotechnology", org: "IGIB Delhi", skills: "Single-cell RNA sequencing, Epigenomics, Cancer Biology", problem: "Single-cell profiling to identify drug resistance mechanisms in leukemia." },
    { name: "Vikas Bhat", email: "vikas@drdo.gov.in", domain: "Aerospace", org: "DRDO Hyderabad", skills: "UAV Design, Stealth Technology, Aerodynamics", problem: "Autonomous drone swarms for disaster relief payload delivery." },
    { name: "Dr. Padma Venkat", email: "padma@cpcb.gov.in", domain: "Environmental Science", org: "CPCB", skills: "Air Quality Modelling, Particulate Matter, Pollution Analytics", problem: "Hyperlocal air quality prediction for smart city interventions." },
    { name: "Suresh Kumar", email: "suresh@tcs.com", domain: "AI / Machine Learning", org: "TCS Research", skills: "Federated Learning, Privacy-Preserving ML, Healthcare AI", problem: "Cross-hospital federated learning without sharing patient data." },
    { name: "Dr. Geeta Thakur", email: "geeta@nii.res.in", domain: "Medical Research", org: "NII Delhi", skills: "Immunotherapy, CAR-T Cells, Tumor Microenvironment", problem: "Personalized CAR-T therapy optimization using patient genomics." },
    { name: "Amit Sharma", email: "amit@ola.com", domain: "Robotics", org: "Ola Electric", skills: "Battery Management Systems, Path Planning, Autonomous Vehicles", problem: "Self-healing battery management for two-wheeler EVs in Indian conditions." },
    { name: "Dr. Kamala Iyengar", email: "kamala@iisc.ac.in", domain: "Materials Science", org: "IISc Bangalore", skills: "2D Materials, Graphene, Photovoltaics", problem: "Perovskite solar cells for flexible wearable electronics." },
    { name: "Ravi Teja", email: "ravi@hyderabad.tech", domain: "Computer Science", org: "T-Hub Hyderabad", skills: "AR/VR, Unity, Haptics, Spatial Computing", problem: "AR-guided surgical training simulators for medical college students." },
    { name: "Dr. Saroja Pandey", email: "saroja@cdsco.gov.in", domain: "Medical Research", org: "CDSCO India", skills: "Clinical Pharmacology, Drug Regulation, Bioequivalence", problem: "AI for accelerating clinical trial protocol review and safety assessment." },
    { name: "Kabir Malhotra", email: "kabir@shopify.in", domain: "Finance / FinTech", org: "Shopify India", skills: "Supply Chain Finance, ML Forecasting, Inventory Optimization", problem: "Demand forecasting for MSMEs using satellite imagery and NLP." },
    { name: "Dr. Uma Shankar", email: "uma@nrsc.gov.in", domain: "Environmental Science", org: "NRSC Hyderabad", skills: "Satellite Remote Sensing, Change Detection, GIS Analytics", problem: "Forest fire prediction using multi-spectral satellite data." },
    { name: "Anika Jain", email: "anika@ideaforge.co", domain: "Aerospace", org: "ideaForge", skills: "Drone Software, Embedded Linux, SLAM", problem: "Indoor mapping drones for disaster-struck collapsed building rescues." },
    { name: "Dr. Balaji Krishnan", email: "balaji@vit.ac.in", domain: "Biotechnology", org: "VIT University", skills: "Bioreactor Design, Fermentation, Synthetic Biology", problem: "Scaling microbial biosynthesis of insulin analogs at low cost." },
    { name: "Ranjit Singh", email: "ranjit@iimb.ac.in", domain: "Finance / FinTech", org: "IIM Bangalore", skills: "Impact Investing, ESG Analytics, Venture Capital", problem: "ESG scoring from unstructured annual reports using LLMs." },
    { name: "Dr. Chitra Bose", email: "chitra@sgpgi.ac.in", domain: "Medical Research", org: "SGPGI Lucknow", skills: "Transplant Medicine, Organ Matching, Biomarkers", problem: "AI-based organ compatibility matching to reduce transplant rejection." },
    { name: "Nitin Kulkarni", email: "nitin@mahindra.com", domain: "Mechanical Engineering", org: "Mahindra R&D", skills: "HVAC, Thermal Systems, Heat Exchangers", problem: "Efficient thermal management for fast-charging EV battery packs." },
    { name: "Dr. Sumitra Verma", email: "sumitra@raipur.aiims.in", domain: "Medical Research", org: "AIIMS Raipur", skills: "Telemedicine, Rural Health, Diagnostic Imaging", problem: "AI-powered diagnostic support for ASHA workers in tribal areas." },
    { name: "Yash Kapoor", email: "yash@byju.com", domain: "Computer Science", org: "BYJU'S", skills: "Adaptive Learning, EdTech, Knowledge Tracing, NLP", problem: "Personalized adaptive learning paths based on cognitive profiling." },
    { name: "Dr. Seema Jha", email: "seema@nimr.org.in", domain: "Biotechnology", org: "NIMR Delhi", skills: "Malaria Research, Vector Control, Drug Resistance", problem: "Predicting artemisinin-resistant malaria strains using genomic surveillance." },
    { name: "Ajay Pandey", email: "ajay@iitguwahati.in", domain: "Civil Engineering", org: "IIT Guwahati", skills: "Flood Modelling, Hydrology, Climate Resilience", problem: "Real-time flood inundation mapping using UAVs and ML for Brahmaputra region." },
    { name: "Dr. Revathi Kumar", email: "revathi@inmas.drdo.in", domain: "Neuroscience", org: "INMAS Delhi", skills: "Radiation Neurology, Cognitive Assessment, fNIRS", problem: "Cognitive fatigue monitoring for pilots using non-invasive brain imaging." },
    { name: "Varun Nair", email: "varun@paytm.com", domain: "Finance / FinTech", org: "Paytm", skills: "Transaction Fraud Detection, AML, Graph-based ML", problem: "Real-time money laundering pattern detection in UPI transaction networks." },
];

// ─── 15 Projects ─────────────────────────────────────────────────────────────
const PROJECTS = [
    { title: "AI-Enhanced Cancer Detection", description: "Using CNNs to identify malignant cells in biopsy slides", problem: "Improve early-stage cancer detection accuracy beyond 95% using deep learning on histopathology images." },
    { title: "Smart Prosthetics with BCI", description: "Brain-computer interface for prosthetic limb control", problem: "Enable amputees to control prosthetic hands using neural signals decoded in real time." },
    { title: "Green Hydrogen from Biomass", description: "Bio-catalytic hydrogen production for rural energy", problem: "Design low-cost bio-reactors that produce green hydrogen from agricultural waste." },
    { title: "Federated Medical AI", description: "Privacy-preserving ML across hospital networks", problem: "Train diagnostic AI across 50 hospitals without sharing any patient data." },
    { title: "Coral Reef Monitoring Drones", description: "Autonomous underwater drones for reef health", problem: "Build real-time marine ecosystem monitoring using swarms of low-cost ROVs and AI." },
    { title: "Earthquake-Resilient Infrastructure", description: "IoT + ML for structural health of bridges and dams", problem: "Detect structural failures in real time using embedded IoT sensors + anomaly detection AI." },
    { title: "Drug Discovery Acceleration", description: "Graph neural networks for molecule-protein binding prediction", problem: "Reduce drug discovery cycle from 12 to 2 years using AI-driven molecular simulation." },
    { title: "AR Surgical Training Simulator", description: "Augmented reality for medical education", problem: "Train surgeons on rare procedures using photorealistic AR simulations without cadavers." },
    { title: "ESG Report Intelligence", description: "LLM-based extraction of sustainability metrics from annual reports", problem: "Automate ESG scoring from 10,000 corporate reports using multilingual NLP pipelines." },
    { title: "Flood Prediction for Brahmaputra", description: "Satellite + ML for real-time flood inundation mapping", problem: "Give 72-hour advance warning of floods to 5 million people in Assam using satellite data." },
    { title: "Perovskite Solar Wearables", description: "Flexible photovoltaics for body-worn health sensors", problem: "Create self-powered wearable biosensors using ultra-thin perovskite solar materials." },
    { title: "CAR-T Therapy Optimization", description: "Personalised cancer immunotherapy using patient genomics", problem: "Match patients to optimal CAR-T cell constructs using single-cell RNA sequencing data." },
    { title: "Urban Air Quality Prediction", description: "Hyperlocal PM2.5 forecasting for smart cities", problem: "Provide street-level air quality forecasts 6 hours ahead using IoT sensors + weather ML." },
    { title: "Micro-Insurance on Blockchain", description: "Trustless parametric insurance for gig workers", problem: "Deploy smart-contract-based micro-insurance that auto-pays farmers on satellite-confirmed drought events." },
    { title: "ASHA Diagnostic AI Assistant", description: "AI diagnostic support for rural community health workers", problem: "Enable ASHA workers to diagnose and triage 10 common diseases using a phone camera + AI." },
];

// ─── Realistic chat messages per project ─────────────────────────────────────
const MESSAGES_PER_PROJECT = [
    // Project 0 — Cancer Detection
    [
        { domain: "Medical Research", msg: "We see a lot of false negatives in lobular carcinoma cases — the cells look deceptively normal." },
        { domain: "AI / Machine Learning", msg: "We can use an attention-based CNN to focus on subtle texture variations. I'll use a vision transformer backbone." },
        { domain: "Medical Research", msg: "Can you explain 'attention mechanism' in simpler terms?" },
        { domain: "AI / Machine Learning", msg: "Sure — it's like teaching the AI to zoom in on the suspicious parts of the image, similar to how a pathologist focuses on specific cell clusters." },
        { domain: "Medical Research", msg: "That makes sense. Our dataset has 12,000 annotated slides. Is that enough?" },
        { domain: "AI / Machine Learning", msg: "It's borderline. We can use data augmentation and transfer learning from a pre-trained model to compensate for the small dataset size." },
        { domain: "Medical Research", msg: "What accuracy can we realistically expect?" },
        { domain: "AI / Machine Learning", msg: "With ViT + fine-tuning, we should target 93-96% AUC on your test set. We'll set up a validation pipeline using your hospital's existing PACS system." },
    ],
    // Project 1 — BCI Prosthetics
    [
        { domain: "Neuroscience", msg: "EEG signals from motor cortex are quite noisy — SNR is around 10 dB in our recordings." },
        { domain: "Robotics", msg: "We use Kalman filtering + ICA to clean the signal before decoding. What electrode count are you working with?" },
        { domain: "Neuroscience", msg: "16-channel wet electrodes. We're seeing mu and beta rhythm suppression during imagined movement." },
        { domain: "Robotics", msg: "Perfect. We can use CSP (Common Spatial Patterns) features as input to an SVM decoder. Latency target is under 200ms." },
        { domain: "Neuroscience", msg: "The patient has cortical reorganisation post-amputation. Will that affect decoding?" },
        { domain: "Robotics", msg: "Yes. We'll need an adaptive decoder that recalibrates daily. I'll use online Riemannian geometry methods for that." },
        { domain: "Neuroscience", msg: "How does the servo motor respond to the decoded signal?" },
        { domain: "Robotics", msg: "We output a 6-DoF velocity command to the prosthetic over Bluetooth LE. The finger movements are mapped from the top-6 imagined gesture classes." },
    ],
    // Project 2 — Green Hydrogen
    [
        { domain: "Chemistry", msg: "Our Ni-Fe catalyst shows 88% faradaic efficiency at low overpotential. What's your scale-up plan?" },
        { domain: "Biotechnology", msg: "We're engineering Chlamydomonas reinhardtii algae to produce H2 under anaerobic conditions. No catalyst needed." },
        { domain: "Chemistry", msg: "Biological H2 production? What's your current yield — µmol H2 per mg chlorophyll?" },
        { domain: "Biotechnology", msg: "Around 180 µmol/mg/hr after the sulfur deprivation cycle. We're targeting 400 through promoter engineering." },
        { domain: "Chemistry", msg: "That's promising. How are you handling the H2S contamination from the sulfur cycle?" },
        { domain: "Biotechnology", msg: "We're using an engineered cysteine desulfhydrase knockout to reduce H2S byproduct by 70%." },
    ],
    // Project 3 — Federated ML
    [
        { domain: "Computer Science", msg: "The communication overhead in FedAvg increases 3× when we add each hospital node beyond 20." },
        { domain: "AI / Machine Learning", msg: "We should switch to FedProx with gradient compression. It handles heterogeneous data distributions better." },
        { domain: "Computer Science", msg: "What happens when a hospital node has completely different class distributions — e.g., a cardiology-only centre?" },
        { domain: "AI / Machine Learning", msg: "We use per-client personalization layers. The shared backbone learns general features; the top layers are fine-tuned per hospital." },
        { domain: "Computer Science", msg: "How do we audit what the model is learning without seeing the raw data?" },
        { domain: "AI / Machine Learning", msg: "We generate saliency maps and aggregate them — each hospital reviews its own saliency locally and reports summary statistics." },
    ],
    // Project 4 — Coral Reefs
    [
        { domain: "Environmental Science", msg: "Bleaching events are accelerating — we're tracking temperature anomalies above 1°C for more than 8 weeks." },
        { domain: "Robotics", msg: "Our ROV can carry a hyperspectral camera and a dissolved oxygen sensor. We need a coral health classifier." },
        { domain: "Environmental Science", msg: "We have 40,000 labelled reef images across 12 Indo-Pacific sites. The key classes are healthy, bleached, and dead coral." },
        { domain: "Robotics", msg: "I'll train a lightweight MobileNetV3 model that fits on our edge computing module — needs to run offline underwater." },
        { domain: "Environmental Science", msg: "Can the drone also collect water samples? We want pH and carbonate ion concentration." },
        { domain: "Robotics", msg: "Yes, I'll add a micro-peristaltic pump with a sample cartridge. We can integrate a miniaturised pH electrode with I2C output." },
    ],
];

// Fill remaining projects with generic messages
for (let i = 5; i < 15; i++) {
    MESSAGES_PER_PROJECT.push([
        { domain: "Medical Research", msg: `Discussing the core problem for project ${i + 1}. We need to align on the scope first.` },
        { domain: "AI / Machine Learning", msg: `Happy to help. Can you share the dataset size and the primary metric we're optimizing for?` },
        { domain: "Medical Research", msg: `We have about 8,000 labelled samples and we're targeting F1 score above 0.90.` },
        { domain: "AI / Machine Learning", msg: `That's workable. I'll propose a baseline using a pre-trained ResNet and then iterate.` },
        { domain: "Computer Science", msg: `For the infrastructure, we should containerize everything with Docker from day one.` },
        { domain: "Biotechnology", msg: `Agreed. What's the timeline for the MVP demo?` },
        { domain: "Computer Science", msg: `If we start Monday, we can have a working proof-of-concept by end of next week.` },
        { domain: "Biotechnology", msg: `Perfect. I'll prepare the lab data exports and the protocol documentation.` },
    ]);
}

// ─── Blockchain contribution data ─────────────────────────────────────────────
const CONTRIBUTION_HASHES = [
    "3f4a9b1c2d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a",
    "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    "9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7",
];

// ─── Main seed function ───────────────────────────────────────────────────────
async function seed() {
    const db = await mysql.createConnection(DB_CONFIG);
    console.log("✅ Connected to MySQL\n");

    // Hash all passwords (same password: "Test@1234")
    const hashedPassword = await bcrypt.hash("Test@1234", 10);
    let insertedUsers = 0;
    let userIds = [];

    console.log("📦 Inserting 52 users...");
    for (const u of USERS) {
        try {
            const [res] = await db.execute(
                `INSERT IGNORE INTO users (name, email, password, domain, organization, skills, problem_statement)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [u.name, u.email, hashedPassword, u.domain, u.org, u.skills, u.problem]
            );
            if (res.insertId) {
                userIds.push({ id: res.insertId, domain: u.domain, name: u.name });
                insertedUsers++;
            }
        } catch (e) {
            // skip if already exists
        }
    }
    console.log(`   ✔ ${insertedUsers} users inserted\n`);

    // Re-fetch all user IDs (in case some already existed)
    const [allUsers] = await db.execute("SELECT id, domain, name FROM users LIMIT 60");
    userIds = allUsers;

    console.log("📦 Inserting 15 projects...");
    let projectIds = [];
    for (let i = 0; i < PROJECTS.length; i++) {
        const p = PROJECTS[i];
        const creator = userIds[i % userIds.length];
        try {
            const [res] = await db.execute(
                `INSERT IGNORE INTO projects (title, description, problem_statement, created_by, status)
         VALUES (?, ?, ?, ?, ?)`,
                [p.title, p.description, p.problem, creator.id, i < 10 ? "active" : "completed"]
            );
            if (res.insertId) {
                projectIds.push(res.insertId);

                // Add 3-5 random members
                const memberCount = 3 + (i % 3);
                const memberSet = new Set([creator.id]);
                while (memberSet.size < Math.min(memberCount, userIds.length)) {
                    memberSet.add(userIds[Math.floor(Math.random() * userIds.length)].id);
                }
                for (const uid of memberSet) {
                    await db.execute(
                        "INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)",
                        [res.insertId, uid]
                    );
                }
            }
        } catch (e) { /* skip */ }
    }
    console.log(`   ✔ ${projectIds.length} projects inserted\n`);

    // Fetch actual project IDs from DB
    const [allProjects] = await db.execute("SELECT id, title FROM projects LIMIT 20");

    console.log("📦 Inserting 120+ messages...");
    let totalMessages = 0;
    for (let pi = 0; pi < allProjects.length; pi++) {
        const proj = allProjects[pi];
        const msgs = MESSAGES_PER_PROJECT[pi % MESSAGES_PER_PROJECT.length];
        for (let mi = 0; mi < msgs.length; mi++) {
            const m = msgs[mi];
            // Pick a user whose domain matches (or random if no match)
            const sender = userIds.find(u => u.domain === m.domain) || userIds[mi % userIds.length];
            const receiver = userIds.find(u => u.domain !== m.domain && u.id !== sender.id) || userIds[(mi + 1) % userIds.length];

            // Simple translation: wrap with [Simplified] tag for demo
            const translations = {
                "Medical Research": "AI / Machine Learning",
                "AI / Machine Learning": "Medical Research",
                "Robotics": "Neuroscience",
                "Neuroscience": "Robotics",
                "Chemistry": "Biotechnology",
                "Biotechnology": "Chemistry",
                "Computer Science": "Medical Research",
            };
            const targetDomain = translations[m.domain] || "General";
            const translated = m.domain !== targetDomain
                ? `[Simplified for ${targetDomain}] ${m.msg.replace(/CNNs?/g, "AI image classifiers").replace(/µmol/g, "micromoles").replace(/FedAvg/g, "Federated Averaging algorithm").replace(/ROV/g, "underwater robot")}`
                : null;

            try {
                await db.execute(
                    `INSERT INTO messages (project_id, user_id, message, translated_message, sender_domain, message_type, created_at)
           VALUES (?, ?, ?, ?, ?, 'user', DATE_SUB(NOW(), INTERVAL ? MINUTE))`,
                    [proj.id, sender.id, m.msg, translated, m.domain, (msgs.length - mi) * 3]
                );
                totalMessages++;
            } catch (e) { /* skip */ }
        }
        // Add an AI facilitator message for each project
        const facilitator = userIds[0];
        await db.execute(
            `INSERT INTO messages (project_id, user_id, message, message_type) VALUES (?, ?, ?, 'ai_facilitator')`,
            [proj.id, facilitator.id, "What specific outcome are you both hoping to achieve by the end of this session? Let's define a concrete next step."]
        ).catch(() => { });
        totalMessages++;
    }
    console.log(`   ✔ ${totalMessages} messages inserted\n`);

    console.log("📦 Inserting blockchain contribution records...");
    let contributions = 0;
    const completedProjects = allProjects.slice(0, 3);
    for (let i = 0; i < completedProjects.length; i++) {
        const proj = completedProjects[i];
        const hash = CONTRIBUTION_HASHES[i % CONTRIBUTION_HASHES.length];
        const tx = `0x${hash.slice(0, 64)}`;
        const [members] = await db.execute(
            "SELECT u.name FROM project_members pm JOIN users u ON pm.user_id = u.id WHERE pm.project_id = ? LIMIT 5",
            [proj.id]
        );
        const contributorNames = JSON.stringify(members.map(m => m.name));
        try {
            await db.execute(
                `INSERT IGNORE INTO contributions (project_id, summary_text, summary_hash, blockchain_tx, blockchain_network, contributors)
         VALUES (?, ?, ?, ?, 'localhost', ?)`,
                [
                    proj.id,
                    `Collaboration summary for "${proj.title}". Team identified key technical approaches and agreed on milestone deliverables. IP ownership documented.`,
                    hash,
                    tx,
                    contributorNames,
                ]
            );
            contributions++;
        } catch (e) { /* skip */ }
    }
    console.log(`   ✔ ${contributions} blockchain records inserted\n`);

    await db.end();
    console.log("===========================================");
    console.log("✅ Seed complete!");
    console.log(`   👤 Users:         ${insertedUsers}`);
    console.log(`   📁 Projects:      ${projectIds.length}`);
    console.log(`   💬 Messages:      ${totalMessages}`);
    console.log(`   🔐 Blockchain:    ${contributions}`);
    console.log("===========================================");
    console.log("\n🔑 Login with any seeded user:");
    console.log("   Email:    ananya@aiims.in  (or any email above)");
    console.log("   Password: Test@1234");
}

seed().catch(console.error);
