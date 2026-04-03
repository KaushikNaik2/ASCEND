# backend/core/scoring.py

class ProficiencyEngine:
    """
    Deterministic state machine for calculating user knowledge vectors.
    Uses bounded weighted deltas to adjust proficiency floats between 0.0 and 1.0.
    """
    def __init__(self, learning_rate: float = 0.2):
        # The alpha dictates how volatile the score changes are. 
        # 0.2 is a stable default for steady progression.
        self.alpha = learning_rate

    def calculate_new_state(
        self, 
        current_proficiency: float, 
        question_difficulty: float, 
        is_correct: bool
    ) -> float:
        """
        Calculates the new proficiency state after a question is answered.
        """
        if is_correct:
            # Reward: Higher reward for answering hard questions correctly.
            # Diminishing returns applied as current_proficiency approaches 1.0.
            delta = self.alpha * (1.0 - current_proficiency) * question_difficulty
        else:
            # Penalty: Higher penalty for getting easy questions wrong.
            # Reduced penalty if the user is already at a low proficiency.
            delta = -self.alpha * current_proficiency * (1.0 - question_difficulty)

        new_proficiency = current_proficiency + delta
        
        # Clamp the boundaries to ensure database integrity (strictly 0.0 to 1.0)
        return max(0.0, min(1.0, round(new_proficiency, 4)))

    def get_target_difficulty(self, current_proficiency: float) -> float:
        """
        Calculates the exact Zone of Proximal Development (ZPD) target difficulty
        to feed into the LLM prompt for the next quiz generation.
        """
        # Aims 0.15 higher than current skill, capped at 1.0
        return min(1.0, round(current_proficiency + 0.15, 2))

# Export a singleton instance to use across your FastAPI routes
scorer = ProficiencyEngine()