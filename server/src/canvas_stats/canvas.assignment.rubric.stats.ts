import {
  numberLike,
  EXPECTATIONS,
  CanvasCourseAssignmentRubricSubmissionMongoDBEntry,
  CanvasLearningObjectiveCategories,
  CanvasCourseAssignmentRubricCategoryAnswerStatistic,
  RubricRatingSubmissionScore,
  CanvasAssignmentWithRubricStatisticsResultObj,
  AssignmentRubricCriteriaMongoDBEntry
} from "../shared/types";

export class CanvasAssignmentWithRubricStats {
  private assignmentRubricObj: AssignmentRubricCriteriaMongoDBEntry[];
  private assignmentRubricSubmissionArr: CanvasCourseAssignmentRubricSubmissionMongoDBEntry[];
  private assignmentRubricExpectationCategories: CanvasLearningObjectiveCategories[] = [];
  private assignmentRubricLearningObjectivesArr: string[] = [];

  // Categories
  private static readonly EXCEEDS_EXPECTATIONS = 0.87; // or higher
  private static readonly MEETS_EXPECTATIONS = 0.75; // from here up to but not including Exceeds Score
  private static readonly BELOW_EXPECTATIONS = 0; // from here up to but not including Meets Score

  constructor(
    rubricObj: AssignmentRubricCriteriaMongoDBEntry[],
    rubricSubmissionArr: CanvasCourseAssignmentRubricSubmissionMongoDBEntry[],
    learningObjectiveArr: string[]
  ) {
    this.assignmentRubricObj = rubricObj;
    this.assignmentRubricSubmissionArr = rubricSubmissionArr;
    this.assignmentRubricLearningObjectivesArr = learningObjectiveArr;
  }

  private get assignmentFinalScoresHelper() {
    const assignmentScores: number[] = [];

    for (const assignmentSubmission of this.assignmentRubricSubmissionArr) {
      assignmentScores.push(assignmentSubmission.canvasAssignmentScore);
    }

    return assignmentScores;
  }

  private get calculateMaxAssignmentPointsHelper() {
    return this.assignmentRubricObj.reduce((acc, curr) => acc + curr.maxCategoryPoints, 0);
  }

  private get computeAssignmentWithRubricAveragePointsEarned() {
    const assignmentScores = this.assignmentFinalScoresHelper;
    const maxAssignmentPoints = this.calculateMaxAssignmentPointsHelper;

    // Convert to a floating-point number and divide by number of entries
    const standardizedAssignmentScoresArr = assignmentScores.map((entry) => entry / maxAssignmentPoints);

    // To perform floating-point division rather than integer division
    return (
      standardizedAssignmentScoresArr.reduce((acc, curr) => acc + curr, 0) / parseFloat("" + assignmentScores.length)
    );
  }

  private get computeAssignmentWithRubricMedianPointsEarned() {
    const assignmentScores = this.assignmentFinalScoresHelper;
    console.warn(assignmentScores);
    const maxAssignmentPoints = this.calculateMaxAssignmentPointsHelper;

    assignmentScores.sort((a, b) => a - b);

    // Convert to a floating-point number and divide by number of entries
    const standardizedAssignmentScoresArr = assignmentScores.map((entry) => entry / maxAssignmentPoints);
    console.warn(standardizedAssignmentScoresArr);

    const medianIndex = Math.floor(standardizedAssignmentScoresArr.length / 2);
    return standardizedAssignmentScoresArr.length % 2 === 0
      ? (standardizedAssignmentScoresArr[medianIndex - 1] + standardizedAssignmentScoresArr[medianIndex]) / 2
      : standardizedAssignmentScoresArr[medianIndex];
  }

  private get computeAssignmentWithRubricPercentageCategories() {
    const assignmentScores = this.assignmentFinalScoresHelper;

    let exceedsCount = 0;
    let meetsCount = 0;
    let belowCount = 0;
    let nullCount = 0;

    for (const assignmentScore of assignmentScores) {
      if (assignmentScore >= CanvasAssignmentWithRubricStats.EXCEEDS_EXPECTATIONS) {
        this.assignmentRubricExpectationCategories.push("EXCEEDS" as const);
        exceedsCount++;
      } else if (
        assignmentScore >= CanvasAssignmentWithRubricStats.MEETS_EXPECTATIONS &&
        assignmentScore < CanvasAssignmentWithRubricStats.EXCEEDS_EXPECTATIONS
      ) {
        this.assignmentRubricExpectationCategories.push("MEETS" as const);
        meetsCount++;
      } else if (
        assignmentScore >= CanvasAssignmentWithRubricStats.BELOW_EXPECTATIONS &&
        assignmentScore < CanvasAssignmentWithRubricStats.MEETS_EXPECTATIONS
      ) {
        this.assignmentRubricExpectationCategories.push("BELOW" as const);
        belowCount++;
      } else {
        // Invalid entry: Negative score
        this.assignmentRubricExpectationCategories.push(null);
        nullCount++;
      }
    }

    return [
      exceedsCount / assignmentScores.length,
      meetsCount / assignmentScores.length,
      belowCount / assignmentScores.length,
      nullCount / assignmentScores.length
    ];
  }

  // TODO: To be implemented - NOT APPLICABLE
  private get computePerQuestionItemDifficulty(): numberLike[] {
    return [];
  }

  // TODO: To be implemented - NOT APPLICABLE
  private get computePerQuestionAveragePointsEarned(): numberLike[] {
    return [];
  }

  // TODO: To be implemented - NOT APPLICABLE
  private get computePerQuestionMedianPointsEarned(): numberLike[] {
    return [];
  }

  // TODO: To be implemented - NOT APPLICABLE
  private get computePerQuestionPercentageCategories(): numberLike[] {
    return [];
  }

  // TODO: To be implemented - NOT APPLICABLE
  private get computePerQuestionAnswerFrequencies(): number[] {
    return [];
  }

  private get computePerLearningObjPercentageCategories() {
    if (this.assignmentFinalScoresHelper.length === 0) {
      return [];
    }

    const hasNonEmptyStrInStringArr = this.assignmentRubricLearningObjectivesArr.some(
      (entry) => entry.trim().length > 0
    );
    if (!hasNonEmptyStrInStringArr) {
      return [];
    }

    const learningObjectiveMapFrequences = new Map<string, number[]>();
    for (const canvasLearningObj of this.assignmentRubricLearningObjectivesArr) {
      if (canvasLearningObj.length > 0) {
        learningObjectiveMapFrequences.set(canvasLearningObj, new Array(4).fill(0) as number[]);
      }
    }

    console.assert(this.assignmentRubricObj.length === this.assignmentRubricLearningObjectivesArr.length);
    for (let i = 0; i < this.assignmentRubricLearningObjectivesArr.length; i++) {
      if (this.assignmentRubricLearningObjectivesArr[i].length === 0) {
        continue;
      }

      const currRubricCategoryLearningObj = this.assignmentRubricLearningObjectivesArr[i];
      const numberArr = learningObjectiveMapFrequences.get(currRubricCategoryLearningObj)!;
      switch (this.assignmentRubricExpectationCategories[i]) {
        case "EXCEEDS":
          numberArr[EXPECTATIONS.EXCEEDS_EXPECTATIONS]++;
          break;
        case "MEETS":
          numberArr[EXPECTATIONS.MEETS_EXPECTATIONS]++;
          break;
        case "BELOW":
          numberArr[EXPECTATIONS.BELOW_EXPECTATIONS]++;
          break;
        default: // "null" case
          numberArr[EXPECTATIONS.NULL]++;
          break;
      }
      learningObjectiveMapFrequences.set(currRubricCategoryLearningObj, numberArr);
    }

    const percentageLearningObjectiveMapFrequences = new Map<string, number[]>();
    for (const canvasLearningObj of this.assignmentRubricLearningObjectivesArr) {
      if (canvasLearningObj.length === 0) {
        continue;
      }

      const currMapEntryNumberArr = learningObjectiveMapFrequences.get(canvasLearningObj)!;
      const totalAssignmentRubricScoresInLearningObj = currMapEntryNumberArr.reduce((acc, score) => acc + score, 0);
      const percentageCategoryArr = currMapEntryNumberArr.map(
        (entry) => entry / totalAssignmentRubricScoresInLearningObj
      );
      percentageLearningObjectiveMapFrequences.set(canvasLearningObj, percentageCategoryArr);
    }

    const percentageLearningObjectiveMapFrequencesArr = Array.from(percentageLearningObjectiveMapFrequences);
    return percentageLearningObjectiveMapFrequencesArr;
  }

  private get assignmentRubricCategoryFinalScoresHelper() {
    const assignmentRubricCategoryScores: CanvasCourseAssignmentRubricCategoryAnswerStatistic[] = [];

    for (const rCriteria of this.assignmentRubricObj) {
      rCriteria.maxCategoryPoints;
      const ratingsSubArr: RubricRatingSubmissionScore[] = [];
      for (const rating of rCriteria.ratings) {
        const newRating: RubricRatingSubmissionScore = {
          description: rating.description,
          ratingPoints: rating.ratingPoints,
          ratingCount: 0
        };
        ratingsSubArr.push(newRating);
      }
      const newCategoryScore: CanvasCourseAssignmentRubricCategoryAnswerStatistic = {
        id: rCriteria.id,
        description: rCriteria.description,
        pointsArr: [],
        ratingsSubArr: ratingsSubArr
      };
      assignmentRubricCategoryScores.push(newCategoryScore);
    }

    for (const assignmentSubmission of this.assignmentRubricSubmissionArr) {
      for (const { id, points } of assignmentSubmission.rubricCategoryScores) {
        for (const rubricCategory of assignmentRubricCategoryScores) {
          if (rubricCategory.id === id) {
            rubricCategory.pointsArr.push(points);
          }
          for (const rating of rubricCategory.ratingsSubArr) {
            if (rating.ratingPoints === points) {
              rating.ratingCount++;
            }
          }
        }
      }
    }

    return assignmentRubricCategoryScores;
  }

  private get computePerRubricCritieriaAveragePointsEarned() {
    const assignmentRubricCategoryScores = this.assignmentRubricCategoryFinalScoresHelper;
    const rubricCategoryAverageArr: number[] = [];

    for (const rubricScore of assignmentRubricCategoryScores) {
      const currPointsArr = rubricScore.pointsArr;

      currPointsArr.sort((a, b) => a - b);

      const totalAssignmentRubricCriteriaPoints = currPointsArr.reduce((acc, curr) => acc + curr, 0);
      const newRubricCategoryAvg = totalAssignmentRubricCriteriaPoints / currPointsArr.length;
      rubricCategoryAverageArr.push(newRubricCategoryAvg);
    }
    return rubricCategoryAverageArr;
  }

  private get computePerRubricCriteriaMedianPointsEarned() {
    const assignmentRubricCategoryScores = this.assignmentRubricCategoryFinalScoresHelper;
    const rubricCategoryMedianArr: number[] = [];

    for (const rubricScore of assignmentRubricCategoryScores) {
      const currPointsArr = rubricScore.pointsArr;

      currPointsArr.sort((a, b) => a - b);

      const medianIndex = Math.floor(currPointsArr.length / 2);
      const newRubricCategoryMedian =
        currPointsArr.length % 2 === 0
          ? (currPointsArr[medianIndex - 1] + currPointsArr[medianIndex]) / 2
          : currPointsArr[medianIndex];
      rubricCategoryMedianArr.push(newRubricCategoryMedian);
    }
    return rubricCategoryMedianArr;
  }

  // Uses the "Builder" software design pattern
  public computeAssignmentWithRubricStats(): CanvasAssignmentWithRubricStatisticsResultObj {
    const assignmentWithRubricStatsResultObj: CanvasAssignmentWithRubricStatisticsResultObj = {
      assignmentAveragePointsEarned: this.computeAssignmentWithRubricAveragePointsEarned,
      assignmentMedianPointsEarned: this.computeAssignmentWithRubricMedianPointsEarned,
      assignmentPercentageCategories: this.computeAssignmentWithRubricPercentageCategories,
      perLearningObjPercentageCategories: this.computePerLearningObjPercentageCategories,
      perRubricCritieriaAveragePointsEarned: this.computePerRubricCritieriaAveragePointsEarned,
      perRubricCritieriaMedianPointsEarned: this.computePerRubricCriteriaMedianPointsEarned,
      perRubricCriteriaAnswerFrequencies: this.assignmentRubricCategoryFinalScoresHelper
    };
    return assignmentWithRubricStatsResultObj;
  }
}
