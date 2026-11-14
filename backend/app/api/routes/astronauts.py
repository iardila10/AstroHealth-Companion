from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_database
from app.models.astronaut import Astronaut
from app.schemas.astronaut import AstronautCreate, AstronautRead, AstronautUpdate

router = APIRouter()


@router.post("/", response_model=AstronautRead, status_code=status.HTTP_201_CREATED)
def create_astronaut(
    astronaut_in: AstronautCreate,
    db: Session = Depends(get_database)
):
    """Crea un nuevo astronauta."""
    astronaut = Astronaut(
        name=astronaut_in.name,
        role=astronaut_in.role,
        current_environment=astronaut_in.current_environment
    )
    db.add(astronaut)
    db.commit()
    db.refresh(astronaut)
    return astronaut


@router.get("/", response_model=List[AstronautRead])
def list_astronauts(db: Session = Depends(get_database)):
    """Lista todos los astronautas."""
    return db.query(Astronaut).all()


@router.get("/{astronaut_id}", response_model=AstronautRead)
def get_astronaut(astronaut_id: int, db: Session = Depends(get_database)):
    """Obtiene un astronauta por ID."""
    astronaut = db.get(Astronaut, astronaut_id)
    if not astronaut:
        raise HTTPException(status_code=404, detail="Astronauta no encontrado")
    return astronaut


@router.patch("/{astronaut_id}", response_model=AstronautRead)
def update_astronaut(
    astronaut_id: int,
    astronaut_in: AstronautUpdate,
    db: Session = Depends(get_database)
):
    """Actualiza parcialmente un astronauta."""
    astronaut = db.get(Astronaut, astronaut_id)
    if not astronaut:
        raise HTTPException(status_code=404, detail="Astronauta no encontrado")

    update_data = astronaut_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(astronaut, field, value)

    db.commit()
    db.refresh(astronaut)
    return astronaut


@router.delete("/{astronaut_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_astronaut(astronaut_id: int, db: Session = Depends(get_database)):
    """Elimina un astronauta."""
    astronaut = db.get(Astronaut, astronaut_id)
    if not astronaut:
        raise HTTPException(status_code=404, detail="Astronauta no encontrado")
    db.delete(astronaut)
    db.commit()
    return None