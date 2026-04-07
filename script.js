let model;

// Load MobileNet when the page loads
window.onload = async () => {
    console.log("Loading MobileNet model...");
    try {
        model = await mobilenet.load();
        console.log("MobileNet loaded successfully.");
    } catch (err) {
        console.error("Error loading MobileNet:", err);
        alert("Failed to load AI model. Please refresh the page.");
    }
};

// Switch sections
function showSection(id) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// Analyze plant image
async function analyzePlant() {
    const fileInput = document.getElementById('plantImage');
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');

    if (!model) {
        alert("AI model is still loading. Please wait a moment and try again.");
        return;
    }

    if (!fileInput.files.length) {
        alert("Please upload a plant photo first.");
        return;
    }

    loading.classList.remove("hidden");
    results.classList.add("hidden");

    const file = fileInput.files[0];
    const imgURL = URL.createObjectURL(file);
    const img = new Image();
    img.src = imgURL;

    img.onload = async () => {
        console.log("Image loaded, running classification...");

        try {
            const predictions = await model.classify(img);
            console.log("Predictions:", predictions);

            const pixelData = await analyzePixels(img);

            loading.classList.add("hidden");

            displayResults(predictions, pixelData);
            results.classList.remove("hidden");

        } catch (err) {
            loading.classList.add("hidden");
            console.error("Error during classification:", err);
            alert("Something went wrong while analyzing. Try again with a clearer image.");
        }
    };
}

// Pixel Analyzer (color, dryness, yellowing, browning, spots)
async function analyzePixels(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    let yellow = 0;
    let brown = 0;
    let darkSpots = 0;
    let bright = 0;
    let total = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Yellow detection
        if (r > 150 && g > 150 && b < 100) yellow++;

        // Brown detection
        if (r > 90 && g < 80 && b < 60) brown++;

        // Dark spot detection
        if (r < 40 && g < 40 && b < 40) darkSpots++;

        // Brightness check
        if (r + g + b > 600) bright++;
    }

    return {
        yellowRatio: yellow / total,
        brownRatio: brown / total,
        darkSpotRatio: darkSpots / total,
        brightRatio: bright / total
    };
}

// Smart analyzer: turn predictions + pixel data into real insights
function displayResults(predictions, px) {
    const top = predictions[0];
    const label = top.className.toLowerCase();
    const confidence = Math.round(top.probability * 100);

    document.getElementById("plantName").textContent =
        "Prediction: " + top.className;

    // Health Score Calculation
    let health = 100;
    health -= px.yellowRatio * 40;
    health -= px.brownRatio * 50;
    health -= px.darkSpotRatio * 60;
    health = Math.max(5, Math.min(health, 100));

    document.getElementById("healthScore").textContent =
        "Health Score: " + Math.round(health) + "/100";

    const issuesList = document.getElementById("issuesList");
    const careList = document.getElementById("careList");

    issuesList.innerHTML = "";
    careList.innerHTML = "";

    let issues = [];
    let care = [];

    // 🌿 Aesthetic App‑Style Logic

    // Yellowing
    if (px.yellowRatio > 0.08) {
        issues.push("Yellowing detected — possible nutrient imbalance or overwatering.");
        care.push("Let the soil dry slightly before watering again.");
        care.push("Add a balanced fertilizer once every 2–4 weeks.");
    }

    // Browning
    if (px.brownRatio > 0.05) {
        issues.push("Brown patches found — dryness or sunburn.");
        care.push("Move plant away from harsh direct sunlight.");
        care.push("Increase humidity around the plant.");
    }

    // Dark spots (fungal patterns)
    if (px.darkSpotRatio > 0.03) {
        issues.push("Dark spot clusters detected — possible fungal activity.");
        care.push("Remove affected leaves to prevent spread.");
        care.push("Improve airflow and avoid misting the leaves.");
    }

    // Brightness check
    if (px.brightRatio > 0.15) {
        issues.push("Image may be overexposed — details are washed out.");
        care.push("Retake photo in softer, indirect lighting.");
    }

    // If MobileNet is confident
    if (confidence > 80 && issues.length === 0) {
        issues.push("Your plant looks healthy and vibrant.");
        care.push("Keep doing what you're doing — great care!");
    }

    // If nothing matched
    if (issues.length === 0) {
        issues.push("The AI couldn't determine a clear issue.");
        care.push("Try a closer, well‑lit photo of a single leaf.");
    }

    // Render results
    issuesList.innerHTML = issues.map(i => `<li>${i}</li>`).join("");
    careList.innerHTML = care.map(c => `<li>${c}</li>`).join("");
}