const sampleDocument = {
  title: "The Impact of Artificial Intelligence on Higher Education Pedagogies in Morocco",
  authors: "Dr. Lahlou Ahmed, Prof. Benali Fatima",
  field: "Humanities", // Also relevant to tech/education
  text: `
# Abstract
The integration of Artificial Intelligence (AI) in higher education has fundamentally disrupted traditional pedagogical frameworks. This thesis explores the impact of AI tools, specifically Large Language Models (LLMs), on research methodologies and student assessment within Moroccan universities (Bac+5 level). We argue that rather than displacing human analytical capabilities, AI necessitates a shift towards "Supervised Reasoning," where the academic supervisor acts as a validator of AI-assisted outputs.

# Methodology
This study employs a Mixed Methods sequential explanatory design. First, a quantitative survey was distributed to 450 Master's and Doctoral students across University Mohammed V and Al Akhawayn University to measure the adoption rate of AI tools in literature reviews. Second, qualitative semi-structured interviews were conducted with 20 faculty members to understand the epistemological shifts in grading rubrics. The data reveals a significant tension between traditional plagiarism metrics and modern AI co-authorship.

# Theoretical Framework
We ground this research in Connectivism (Siemens, 2005) and the Zone of Proximal Development (Vygotsky, 1978), expanding the latter to include AI as the "More Knowledgeable Other." We propose a new theoretical model: The AI-Mediated Research Loop, which posits that academic rigor is no longer measured by the absence of AI, but by the transparency and critical verification of its use.

# Key Findings
1. 82% of students use AI for structural ideation, but only 14% disclose its use.
2. The most critical failure point in AI-assisted research is methodological mismatch, where students fail to align qualitative paradigms with the appropriate epistemological grounding.
3. Moroccan supervisors who implemented "process-based grading" (reviewing prompts and AI outputs) reported higher quality theses than those relying solely on Turnitin.

# Conclusion
We recommend the formal adoption of "AI Declarations" in Moroccan university theses and a shift in supervision styles from punitive anti-plagiarism to constructive AI orchestration.
  `
};

async function ingest() {
  console.log("🚀 Starting ingestion of sample academic document...");
  
  try {
    const response = await fetch("http://localhost:3000/api/ingest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sampleDocument),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Success!");
      console.log(`Document ID: ${result.document_id}`);
      console.log(`Chunks embedded and stored: ${result.chunks_embedded}`);
      if (result.errors && result.errors.length > 0) {
        console.error(`⚠️ Errors during embedding:`, result.errors);
      }
    } else {
      console.error("❌ Failed to ingest:", result.error);
    }
  } catch (error) {
    console.error("❌ Network or script error:", error.message);
    console.log("Make sure your Next.js server is running on http://localhost:3000!");
  }
}

ingest();
