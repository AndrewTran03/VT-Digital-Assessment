import {
  CanvasQuizQuestionAnswerFrequencyArrEntry,
  CanvasQuizQuestionAnswerFrequencyStatistic,
  CanvasQuizQuestionAnswerSetFrequencyArrEntry,
  CanvasQuizStatistic,
  QuestionTypeEnumValues,
  numberLike,
  CanvasLearningObjectiveCategories,
  CanvasQuizStatisticsResultObj
} from "../../assets/types";
import log from "../utils/logger";

enum EXPECTATIONS {
  EXCEEDS_EXPECTATIONS = 0,
  MEETS_EXPECTATIONS = 1,
  BELOW_EXPECTATIONS = 2,
  NULL = 3
}

export class CanvasQuizStats {
  private canvasQuizStatistic: CanvasQuizStatistic;
  private canvasQuizQuestionLearningObjectivesArr: string[];
  private quesExpectationCategories: CanvasLearningObjectiveCategories[] = [];

  // Categories
  private static readonly EXCEEDS_EXPECTATIONS = 0.87; // or higher
  private static readonly MEETS_EXPECTATIONS = 0.75; // from here up to but not including Exceeds Score
  private static readonly BELOW_EXPECTATIONS = 0; // from here up to but not including Meets Score

  constructor(stats: CanvasQuizStatistic, quesLearningObjArr: string[]) {
    this.canvasQuizStatistic = stats;
    this.canvasQuizQuestionLearningObjectivesArr = quesLearningObjArr;
  }

  private get computeQuizAveragePointsEarned() {
    const submissionStatisticsCategory = this.canvasQuizStatistic.submission_statistics;
    if (submissionStatisticsCategory.score_high && submissionStatisticsCategory.score_average) {
      return submissionStatisticsCategory.score_average / submissionStatisticsCategory.score_high;
    }
    return null;
  }

  private get computeQuizMedianPointsEarned() {
    if (Object.entries(this.canvasQuizStatistic.submission_statistics.scores).length === 0) {
      return null;
    }

    const quizScores: number[] = [];

    for (const [range, count] of Object.entries(this.canvasQuizStatistic.submission_statistics.scores)) {
      const score = parseInt(range);
      for (let i = 0; i < count; i++) {
        quizScores.push(score);
      }
    }

    quizScores.sort((a, b) => a - b);

    const medianIndex = Math.floor(quizScores.length / 2);
    return (
      (quizScores.length % 2 === 0
        ? (quizScores[medianIndex - 1] + quizScores[medianIndex]) / 2
        : quizScores[medianIndex]) / 100
    );
  }

  private get computeQuizPercentageCategories() {
    const questionAverages = this.computePerQuestionAveragePointsEarned;

    let exceedsCount = 0;
    let meetsCount = 0;
    let belowCount = 0;
    let nullCount = 0;

    for (const questionAverage of questionAverages) {
      if (questionAverage === null) {
        this.quesExpectationCategories.push(null);
      } else if (questionAverage >= CanvasQuizStats.EXCEEDS_EXPECTATIONS) {
        this.quesExpectationCategories.push("EXCEEDS" as const);
      } else if (
        questionAverage >= CanvasQuizStats.MEETS_EXPECTATIONS &&
        questionAverage < CanvasQuizStats.EXCEEDS_EXPECTATIONS
      ) {
        this.quesExpectationCategories.push("MEETS" as const);
      } else if (
        questionAverage >= CanvasQuizStats.BELOW_EXPECTATIONS &&
        questionAverage < CanvasQuizStats.MEETS_EXPECTATIONS
      ) {
        this.quesExpectationCategories.push("BELOW" as const);
      } else {
        this.quesExpectationCategories.push(null);
      }
    }

    return [
      exceedsCount / questionAverages.length,
      meetsCount / questionAverages.length,
      belowCount / questionAverages.length,
      nullCount / questionAverages.length
    ];
  }

  private get computePerQuestionItemDifficulty() {
    const questionItemDifficulties: numberLike[] = [];

    for (const question_statistic of this.canvasQuizStatistic.question_statistics) {
      questionItemDifficulties.push(question_statistic.difficulty_index ? question_statistic.difficulty_index : null);
    }
    return questionItemDifficulties;
  }

  private get computePerQuestionAveragePointsEarned() {
    const questionAverages: numberLike[] = [];

    for (const question_statistic of this.canvasQuizStatistic.question_statistics) {
      switch (question_statistic.question_type) {
        case "multiple_choice_question": {
          if (question_statistic.answers && question_statistic.answers.length > 0) {
            let weightedSum = 0;
            let numEntries = 0;
            for (const answer of question_statistic.answers) {
              if (answer.correct) {
                weightedSum += 1 * answer.responses;
              } else {
                weightedSum += 0 * answer.responses;
              }
              numEntries += answer.responses;
            }
            questionAverages.push(weightedSum / numEntries);
          } else {
            questionAverages.push(null);
          }
          break;
        }
        case "multiple_answers_question": {
          if (question_statistic.answers && question_statistic.answers.length > 0) {
            const numEntries = question_statistic.responses;
            const multipleAnswerUserIds = new Set<number>();
            const multipleAnswerStudentScores: number[] = [];

            const numCorrectAnswers = question_statistic.answers.filter((entry) => entry.correct).length;
            console.assert(numCorrectAnswers > 0);
            const potentialPointChangeMultipleAnswers = 1 / numCorrectAnswers;

            // Gets a full list of user_ids from answers
            for (const answer of question_statistic.answers) {
              for (const userId of answer.user_ids) {
                if (!multipleAnswerUserIds.has(userId)) {
                  multipleAnswerUserIds.add(userId);
                }
              }
            }

            // Iterate through set, getting statistics for each student
            for (const userId of multipleAnswerUserIds) {
              let weightedSum = 0;
              for (const answer of question_statistic.answers) {
                if (answer.user_ids.includes(userId)) {
                  weightedSum += answer.correct
                    ? potentialPointChangeMultipleAnswers
                    : -potentialPointChangeMultipleAnswers;
                }
              }
              weightedSum = Math.max(weightedSum, 0); // Just in case more selected wrong goes negative
              multipleAnswerStudentScores.push(weightedSum);
            }

            // Calculate average score
            const sumScores = multipleAnswerStudentScores.reduce((acc, score) => acc + score, 0);
            const averageScore = sumScores / numEntries;
            questionAverages.push(averageScore);
          } else {
            questionAverages.push(null);
          }
          break;
        }
        case "true_false_question": {
          if (question_statistic.answers && question_statistic.answers.length > 0) {
            let weightedSum = 0;
            let numEntries = 0;
            for (const answer of question_statistic.answers) {
              if (answer.text.toLowerCase() === "true") {
                weightedSum += 1 * answer.responses;
              } else {
                // "false"
                weightedSum += 0 * answer.responses;
              }
              numEntries += answer.responses;
            }
            questionAverages.push(weightedSum / numEntries);
          } else {
            questionAverages.push(null);
          }
          break;
        }
        case "fill_in_multiple_blanks_question": {
          if (question_statistic.answerSets && question_statistic.answerSets.length > 0) {
            let weightedSum = 0;
            let numEntries = 0;
            for (const answerSet of question_statistic.answerSets) {
              if (answerSet.answers && answerSet.answers.length > 0) {
                for (const answer of answerSet.answers) {
                  if (answer.correct) {
                    weightedSum += 1 * answer.responses;
                  } else {
                    weightedSum += 0 * answer.responses;
                  }
                  numEntries += answer.responses;
                }
              }
            }
            questionAverages.push(weightedSum / numEntries);
          } else {
            questionAverages.push(null);
          }
          break;
        }
        case "multiple_dropdowns_question": {
          if (question_statistic.answerSets && question_statistic.answerSets.length > 0) {
            const numEntries =
              question_statistic.correct! + question_statistic.partially_correct! + question_statistic.incorrect!;
            const multipleDropdownsUserIds = new Set<number>();
            const multipleDropdownStudentScores: number[] = [];

            // Gets a full list of user_ids from answers
            for (const answerSet of question_statistic.answerSets) {
              for (const answer of answerSet.answers) {
                for (const userId of answer.user_ids) {
                  if (!multipleDropdownsUserIds.has(userId)) {
                    multipleDropdownsUserIds.add(userId);
                  }
                }
              }
            }

            // Iterate through set, getting statistics for each student
            for (const userId of multipleDropdownsUserIds) {
              const currStudentScores: number[] = [];
              for (const answer of question_statistic.answers) {
                if (answer.user_ids.includes(userId)) {
                  currStudentScores.push(answer.correct ? 1 : 0);
                }
              }
              // Calculate average score for each student across all dropdowns
              multipleDropdownStudentScores.push(
                currStudentScores.reduce((acc, score) => acc + score, 0) / currStudentScores.length
              );
            }

            // Calculate average score across all students and all dropdowns
            const sumScores = multipleDropdownStudentScores.reduce((acc, score) => acc + score, 0);
            const averageScore = sumScores / numEntries;
            questionAverages.push(averageScore);
          } else {
            questionAverages.push(null);
          }
          break;
        }
        case "essay_question": {
          if (question_statistic.answers && question_statistic.answers.length > 0) {
            if (question_statistic.answers[0].id === "ungraded") {
              questionAverages.push(1);
            } else {
              let weightedSum = 0;
              let numEntries = 0;
              for (const answer of question_statistic.answers) {
                if (answer.id === "top") {
                  weightedSum += 1 * answer.responses;
                } else if (answer.id === "middle") {
                  weightedSum += 0.5 * answer.responses;
                } else if (answer.id === "bottom") {
                  weightedSum += 0 * answer.responses;
                }
                numEntries += answer.responses;
              }
              questionAverages.push(weightedSum / numEntries);
            }
          } else {
            questionAverages.push(null);
          }
          break;
        }
        case "numerical_question": {
          if (question_statistic.answers && question_statistic.answers.length > 0) {
            const responses = Math.max(
              !question_statistic.full_credit ? 0 : question_statistic.full_credit,
              question_statistic.responses
            );
            questionAverages.push((!question_statistic.correct ? 0 : question_statistic.correct) / responses);
          } else {
            questionAverages.push(null);
          }
          break;
        }
        case "short_answer_question": {
          if (question_statistic.answers && question_statistic.answers.length > 0) {
            if (question_statistic.correct && question_statistic.correct === 0) {
              questionAverages.push(1); // Every student got it "correct" (open-ended and awarded credit)
            } else {
              questionAverages.push(null);
            }
          } else {
            questionAverages.push(null);
          }
          break;
        }
        default: {
          log.error("Invalid question type!");
          process.exit(1);
        }
      }
    }
    return questionAverages;
  }

  // TODO: To be implemented
  private get computePerQuestionMedianPointsEarned(): numberLike[] {
    return []; // QUESTION: Relevance?
  }

  // TODO: To be implemented
  private get computePerQuestionPercentageCategories(): numberLike[] {
    return []; // QUESTION: Relevance?
  }

  private get computePerQuestionAnswerFrequencies() {
    const canvasQuizQuestionAnswerFrequencies: CanvasQuizQuestionAnswerFrequencyStatistic[] = [];

    for (const question_statistic of this.canvasQuizStatistic.question_statistics) {
      switch (question_statistic.question_type) {
        case "multiple_choice_question":
        case "multiple_answers_question":
        case "true_false_question":
        case "essay_question":
        case "numerical_question":
        case "short_answer_question": {
          const frequencyArr: CanvasQuizQuestionAnswerFrequencyArrEntry[] = [];
          const frequencySetArr: CanvasQuizQuestionAnswerSetFrequencyArrEntry[] = [];
          if (question_statistic.answers && question_statistic.answers.length > 0) {
            for (const answer of question_statistic.answers) {
              const currAnswer = answer;
              const newAnswerEntry: CanvasQuizQuestionAnswerFrequencyArrEntry = {
                answer_text: currAnswer.text ?? currAnswer.id, // Nullish operator for "essay_question" case
                frequency_count: currAnswer.responses
              };
              frequencyArr.push(newAnswerEntry);
            }
          }
          const newCanvasQuizQuestionEntry: CanvasQuizQuestionAnswerFrequencyStatistic = {
            question_text: question_statistic.question_text as QuestionTypeEnumValues,
            question_type: question_statistic.question_type,
            answer_frequencies: frequencyArr,
            answer_set_frequencies: frequencySetArr
          };
          canvasQuizQuestionAnswerFrequencies.push(newCanvasQuizQuestionEntry);
          break;
        }
        case "fill_in_multiple_blanks_question":
        case "multiple_dropdowns_question": {
          const frequencyArr: CanvasQuizQuestionAnswerFrequencyArrEntry[] = [];
          const frequencySetArr: CanvasQuizQuestionAnswerSetFrequencyArrEntry[] = [];
          if (question_statistic.answerSets && question_statistic.answerSets.length > 0) {
            for (const answerSet of question_statistic.answerSets) {
              const frequencyArrForAnswers: CanvasQuizQuestionAnswerFrequencyArrEntry[] = [];
              if (answerSet.answers && answerSet.answers.length > 0) {
                for (const answer of answerSet.answers) {
                  const newAnswerEntry: CanvasQuizQuestionAnswerFrequencyArrEntry = {
                    answer_text: answer.text,
                    frequency_count: answer.responses
                  };
                  frequencyArrForAnswers.push(newAnswerEntry);
                }
              }
              const newAnswerSetEntry: CanvasQuizQuestionAnswerSetFrequencyArrEntry = {
                answer_set_text: answerSet.text,
                answer_frequencies: frequencyArrForAnswers
              };
              frequencySetArr.push(newAnswerSetEntry);
            }
          }
          const newCanvasQuizQuestionEntry: CanvasQuizQuestionAnswerFrequencyStatistic = {
            question_text: question_statistic.question_text as QuestionTypeEnumValues,
            question_type: question_statistic.question_type,
            answer_frequencies: frequencyArr,
            answer_set_frequencies: frequencySetArr
          };
          canvasQuizQuestionAnswerFrequencies.push(newCanvasQuizQuestionEntry);
          break;
        }
        default: {
          log.error("Invalid question type!");
          process.exit(1);
        }
      }
    }
    return canvasQuizQuestionAnswerFrequencies;
  }

  private get computePerLearningObjPercentageCategories() {
    const hasNonEmptyStrInStringArr = this.canvasQuizQuestionLearningObjectivesArr.some(
      (entry) => entry.trim().length > 0
    );
    if (!hasNonEmptyStrInStringArr) {
      return [];
    }

    const learningObjectiveMapFrequences = new Map<string, number[]>();
    for (const canvasLearningObj of this.canvasQuizQuestionLearningObjectivesArr) {
      if (canvasLearningObj.length > 0) {
        learningObjectiveMapFrequences.set(canvasLearningObj, new Array(4).fill(0) as number[]);
      }
    }

    console.assert(
      this.canvasQuizStatistic.question_statistics.length === this.canvasQuizQuestionLearningObjectivesArr.length
    );
    for (let i = 0; i < this.canvasQuizQuestionLearningObjectivesArr.length; i++) {
      if (this.canvasQuizQuestionLearningObjectivesArr[i].length === 0) {
        continue;
      }

      const currQuesLearningObj = this.canvasQuizQuestionLearningObjectivesArr[i];
      const numberArr = learningObjectiveMapFrequences.get(currQuesLearningObj)!;
      switch (this.quesExpectationCategories[i]) {
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
      learningObjectiveMapFrequences.set(currQuesLearningObj, numberArr);
    }

    const percentageLearningObjectiveMapFrequences = new Map<string, number[]>();
    for (const canvasLearningObj of this.canvasQuizQuestionLearningObjectivesArr) {
      if (canvasLearningObj.length === 0) {
        continue;
      }

      const currMapEntryNumberArr = learningObjectiveMapFrequences.get(canvasLearningObj)!;
      const totalQuestionsInLearningObj = currMapEntryNumberArr.reduce((acc, score) => acc + score, 0);
      const percentageCategoryArr = currMapEntryNumberArr.map((entry) => entry / totalQuestionsInLearningObj);
      percentageLearningObjectiveMapFrequences.set(canvasLearningObj, percentageCategoryArr);
    }

    const percentageLearningObjectiveMapFrequencesArr = Array.from(percentageLearningObjectiveMapFrequences);
    return percentageLearningObjectiveMapFrequencesArr;
  }

  // Uses the "Builder" software design pattern
  computeStats() {
    const quizStatsResultObj: CanvasQuizStatisticsResultObj = {
      quizAveragePointsEarned: this.computeQuizAveragePointsEarned,
      quizMedianPointsEarned: this.computeQuizMedianPointsEarned,
      quizPercentageCategories: this.computeQuizPercentageCategories,
      perQuestionItemDifficulty: this.computePerQuestionItemDifficulty,
      perQuestionAveragePointsEarned: this.computePerQuestionAveragePointsEarned,
      perQuestionAnswerFrequencies: this.computePerQuestionAnswerFrequencies,
      perLearningObjPercentageCategories: this.computePerLearningObjPercentageCategories
    };
    return quizStatsResultObj;
  }
}
