use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct OllamaResponse {
    response: String,
}

pub async fn check_ollama_available() -> bool {
    reqwest::Client::new()
        .get("http://localhost:11434/api/tags")
        .timeout(std::time::Duration::from_secs(2))
        .send()
        .await
        .map(|r| r.status().is_success())
        .unwrap_or(false)
}

pub async fn refine_intent_with_ollama(raw_intent: &str) -> Result<String, String> {
    if !check_ollama_available().await {
        return Err("Ollama is not running. Install from ollama.com and start it.".into());
    }

    let client = reqwest::Client::new();
    let prompt = format!(
        "Rewrite this focus goal as one clear, specific sentence (max 20 words). \
         Only output the rewritten sentence, nothing else.\n\nGoal: {raw_intent}"
    );

    let body = OllamaRequest {
        model: "gemma2:2b".into(),
        prompt,
        stream: false,
    };

    let resp = client
        .post("http://localhost:11434/api/generate")
        .json(&body)
        .timeout(std::time::Duration::from_secs(30))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err("Ollama request failed. Try: ollama pull gemma2:2b".into());
    }

    let data: OllamaResponse = resp.json().await.map_err(|e| e.to_string())?;
    Ok(data.response.trim().to_string())
}

pub fn rule_based_suggestion(avg_minutes: u32, best_hours: &[String]) -> String {
    let hour_hint = best_hours
        .first()
        .map(|h| format!(" around {h}"))
        .unwrap_or_default();
    format!(
        "Try a {}-minute session{} based on your history.",
        avg_minutes.clamp(15, 60),
        hour_hint
    )
}
