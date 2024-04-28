import { z } from "zod";
import { QuestionTypeValues, seasonValuesArr } from "../shared/types";

const canvasQuizQuestionSchema = z
  .object({
    canvasUserId: z.number().gte(0),
    canvasCourseInternalId: z.number().gte(0),
    canvasCourseName: z.string().min(1),
    canvasCourseDept: z.string().min(1),
    canvasCourseNum: z.number().gte(0),
    canvasCourseAcademicSemesterOffered: z.enum(seasonValuesArr),
    canvasCourseAcademicYearOffered: z.number().gte(0),
    quizId: z.number().gte(0),
    quizName: z.string().min(1),
    canvasMatchedLearningObjectivesArr: z.array(z.array(z.string()).default([])).default([]),
    canvasQuizEntries: z
      .array(
        z.object({
          questionType: z.enum(QuestionTypeValues),
          questionText: z.string().min(1),
          answers: z.array(
            z.object({
              weight: z.number().gte(0).optional(),
              migration_id: z.string().min(1).optional(),
              id: z.number().gte(0).optional(),
              text: z.string().min(1).optional()
            })
          )
        })
      )
      .default([])
  })
  .strict();

const canvasAssignmentRubricSchema = z
  .object({
    canvasUserId: z.number().gte(0),
    canvasDeptAbbrev: z.string().min(1),
    canvasCourseNum: z.number().gte(0),
    canvasCourseName: z.string().min(1),
    canvasCourseInternalId: z.number().gte(0),
    canvasCourseAcademicSemesterOffered: z.enum(seasonValuesArr),
    canvasCourseAcademicYearOffered: z.number().gte(0),
    canvasMatchedLearningObjectivesArr: z.array(z.array(z.string())).default([]),
    recentSubmissionData: z
      .array(
        z.object({
          canvasAssignmentScore: z.number().gte(0),
          rubricCategoryScores: z.array(
            z.object({
              id: z.string().min(1),
              points: z.number().gte(0).default(0)
            })
          )
        })
      )
      .default([]),
    canvasAssignmentId: z.number().gte(0),
    canvasAssignmentName: z.string().min(1),
    canvasRubricId: z.number().gte(0),
    title: z.string().min(1),
    maxPoints: z.number().gte(0),
    rubricData: z
      .array(
        z.object({
          id: z.string().min(1),
          maxCategoryPoints: z.number().gte(0),
          description: z.string().min(1),
          ratings: z
            .array(
              z.object({
                description: z.string().min(1),
                ratingPoints: z.number().gte(0)
              })
            )
            .default([])
        })
      )
      .default([])
  })
  .strict();

export { canvasQuizQuestionSchema, canvasAssignmentRubricSchema };
