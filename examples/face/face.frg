#lang forge


abstract sig FacePart {}

sig Eye extends FacePart {
}
sig Nose extends FacePart {}
sig Mouth extends FacePart {}

sig Face {
    below : set FacePart->FacePart,
    right : set FacePart->FacePart
}

inst face {
    Face = `Face
    Eye = `EyeLeft + `EyeRight
    Nose = `Nose
    Mouth = `Mouth
    FacePart = Eye + Nose + Mouth

    below = `Face -> (`EyeLeft -> `Nose + `EyeRight -> `Nose + `Nose -> `Mouth)
    right = `Face -> (`EyeLeft -> `EyeRight)


}

run {} for face