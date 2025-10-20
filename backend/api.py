from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from .mock_services import (
    search_by_application, get_material_by_name,
    predict_props, suggest_synthesis, generate_candidate
)

api = APIRouter(prefix="/api", tags=["mof"])

# ======== Schemas (مبسّطة) ========
class OperatingConditions(BaseModel):
    T_K: Optional[float] = None
    P_bar: Optional[float] = None
    humidity_pct: Optional[float] = None

class Constraints(BaseModel):
    selectivity_min: Optional[float] = None
    uptake_min_mmol_g: Optional[float] = None
    operating_conditions: Optional[OperatingConditions] = None

class ForwardRequest(BaseModel):
    application: str
    constraints: Optional[Constraints] = None
    lang: str = "en"

class Candidate(BaseModel):
    material_id: str
    name: str
    fit_score: float
    uncertainty: float
    predicted_props: Dict[str, float] = Field(default_factory=dict)
    suggested_synthesis: Dict[str, Any] = Field(default_factory=dict)
    rationale: str = ""
    sources: List[str] = Field(default_factory=list)

class ForwardResponse(BaseModel):
    candidates: List[Candidate]

class InverseMaterial(BaseModel):
    name: Optional[str] = None
    cif_url: Optional[str] = None

class InverseRequest(BaseModel):
    material: InverseMaterial
    lang: str = "en"

class AppSuggestion(BaseModel):
    application: str
    fit_score: float
    uncertainty: float
    key_props: Dict[str, float] = Field(default_factory=dict)
    operating_tips: Dict[str, Any] = Field(default_factory=dict)

class InverseResponse(BaseModel):
    applications: List[AppSuggestion]

class ChatRequest(BaseModel):
    message: str
    lang: str = "en"

class ChatResponse(BaseModel):
    reply: str

# ======== Routes ========
@api.post("/forward", response_model=ForwardResponse)
def forward(req: ForwardRequest):
    mats = search_by_application(req.application)
    cands: List[Dict[str, Any]] = []
    for m in mats:
        props = predict_props(m)
        score = 0.8 if "UiO" in m["name"] else 0.7
        cands.append(Candidate(
            material_id=m["id"], name=m["name"],
            fit_score=score, uncertainty=0.15 if score>0.75 else 0.22,
            predicted_props=props,
            suggested_synthesis=suggest_synthesis(m["name"]),
            rationale="Baseline mock rationale.", sources=["internal:mock"]
        ))
    gen = generate_candidate(req.application)
    cands.append(Candidate(
        material_id=gen["id"], name=gen["name"],
        fit_score=0.78, uncertainty=0.28,
        predicted_props={"selectivity":31.1,"uptake_mmol_g":3.0},
        suggested_synthesis=suggest_synthesis(gen["name"]),
        rationale="Generated candidate (mock).", sources=[]
    ))
    # apply constraints if provided
    if req.constraints:
        if req.constraints.selectivity_min is not None:
            cands = [cand for cand in cands if cand.predicted_props.get("selectivity", 0) >= req.constraints.selectivity_min]
        if req.constraints.uptake_min_mmol_g is not None:
            cands = [cand for cand in cands if cand.predicted_props.get("uptake_mmol_g", 0) >= req.constraints.uptake_min_mmol_g]
    return ForwardResponse(candidates=cands)

@api.post("/inverse", response_model=InverseResponse)
def inverse(req: InverseRequest):
    m = get_material_by_name(req.material.name)
    apps = [
        AppSuggestion(application="VOC_removal", fit_score=0.79, uncertainty=0.18,
                      key_props={"sa_m2g": float(m["computed_props"].get("sa_m2g", 1200)),
                                 "open_metal_sites": float(m["computed_props"].get("open_metal_sites", 0))},
                      operating_tips={"humidity_max_pct": 30}),
        AppSuggestion(application="H2_storage", fit_score=0.68, uncertainty=0.22,
                      key_props={"sa_m2g": float(m["computed_props"].get("sa_m2g", 1200))},
                      operating_tips={"T_K": 77, "P_bar": 50}),
    ]
    return InverseResponse(applications=apps)

@api.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    msg = req.message.lower()
    if "co2" in msg:
        return ChatResponse(reply="Forward tip: set application=CO2_capture at 298 K, 1 bar; try UiO-66-NH2 as a baseline.")
    if "h2" in msg or "hydrogen" in msg:
        return ChatResponse(reply="For H₂ storage, consider high surface area MOFs; try 77 K, high P. Use Forward to rank candidates.")
    return ChatResponse(reply="Choose: Forward (application→MOF) or Inverse (MOF→applications). You can also submit experiments.")
