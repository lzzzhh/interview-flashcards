#!/opt/anaconda3/bin/python3
"""bge-reranker-v2-m3 bridge — stdin JSON, stdout JSON"""
import sys, json
from sentence_transformers import CrossEncoder

MODEL = "BAAI/bge-reranker-v2-m3"

# Load model (first call downloads ~2GB)
model = CrossEncoder(MODEL, device="mps")  # MPS for Apple Silicon

print(json.dumps({"id": 0, "status": "ready", "model": MODEL, "device": str(model.model.device)}), flush=True)

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        req = json.loads(line)
        query = req["query"]
        docs = req["documents"]
        top_n = req.get("top_n", len(docs))

        # Cross-encode: pairs of (query, doc)
        pairs = [[query, doc] for doc in docs]
        scores = model.predict(pairs, show_progress_bar=False)

        # Sort and return top_n
        scored = sorted(enumerate(scores.tolist()), key=lambda x: -x[1])
        results = [{"index": i, "score": float(s)} for i, s in scored[:top_n]]

        print(json.dumps({"results": results}), flush=True)
    except Exception as e:
        print(json.dumps({"error": str(e)}), flush=True)
