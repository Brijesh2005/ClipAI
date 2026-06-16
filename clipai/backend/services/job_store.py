import threading
from typing import Dict, Any, Optional
from datetime import datetime

class JobStore:
    def __init__(self):
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def create(self, job_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        with self._lock:
            job = {
                "id": job_id,
                "status": "queued",
                "progress": 0,
                "step": "Queued",
                "created_at": datetime.utcnow().isoformat(),
                "clips": [],
                "error": None,
                **data,
            }
            self._jobs[job_id] = job
            return job

    def get(self, job_id: str) -> Optional[Dict[str, Any]]:
        return self._jobs.get(job_id)

    def update(self, job_id: str, **kwargs):
        with self._lock:
            if job_id in self._jobs:
                self._jobs[job_id].update(kwargs)

    def all(self):
        return list(self._jobs.values())

job_store = JobStore()
