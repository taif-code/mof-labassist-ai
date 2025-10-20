from typing import Dict, Any, List
import uuid

MOCK_DB = [
    {"id":"MOF_00123","name":"UiO-66-NH2","metal_node":"Zr","topology":"fcu",
     "computed_props":{"sa_m2g":1200,"stability_index":0.92}},
    {"id":"HKUST_1","name":"HKUST-1","metal_node":"Cu","topology":"tbo",
     "computed_props":{"sa_m2g":1500,"open_metal_sites":1}},
]

def search_by_application(app: str) -> List[Dict[str, Any]]:
    # إرجاع مواد افتراضية مرتّبة بشكل بسيط
    return MOCK_DB

def get_material_by_name(name: str | None) -> Dict[str, Any]:
    if not name:
        return MOCK_DB[0]
    for m in MOCK_DB:
        if m["name"].lower() == name.lower():
            return m
    return MOCK_DB[0]

def predict_props(material: Dict[str, Any]) -> Dict[str, float]:
    base = material.get("computed_props", {})
    return {
        "selectivity": 28.4 if "UiO" in material["name"] else 22.0,
        "uptake_mmol_g": 3.3 if "UiO" in material["name"] else 2.6,
        "stability_index": float(base.get("stability_index", 0.80))
    }

def suggest_synthesis(name: str) -> Dict[str, Any]:
    if "UiO-66" in name:
        return {"solvent":"Water/EtOH","temp_C":120,"time_h":12,"modulator":"Acetic"}
    return {"solvent":"MeOH","temp_C":100}

def generate_candidate(app: str) -> Dict[str, Any]:
    return {"id":"GEN_"+uuid.uuid4().hex[:6].upper(),"name":"GenMOF-A","topology":"ftw",
            "computed_props":{"sa_m2g":1350}}
