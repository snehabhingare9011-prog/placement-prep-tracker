import { Question } from '../models/Question.js'

export async function evaluateTestAttempt(testAttempt, test) {
  // Fetch questions with their correct answers from DB
  const questionIds = test.questions.map(q => (q._id ? q._id : q))
  const dbQuestions = await Question.find({ _id: { $in: questionIds } }).lean()
  const questionMap = new Map(dbQuestions.map(q => [q._id.toString(), q]))

  const marksPerQuestion = test.marksPerQuestion || 4
  const negativeMarking = test.negativeMarking || 1

  let correctCount = 0
  let incorrectCount = 0
  let unansweredCount = 0

  const subjectStats = {}
  const topicStats = {}

  for (const answer of testAttempt.answers) {
    const q = questionMap.get(answer.questionId.toString())
    if (!q) continue

    const subj = q.subject || 'General'
    const top = q.topic || 'General'

    if (!subjectStats[subj]) {
      subjectStats[subj] = { total: 0, correct: 0 }
    }
    if (!topicStats[top]) {
      topicStats[top] = { total: 0, correct: 0, subject: subj }
    }

    subjectStats[subj].total += 1
    topicStats[top].total += 1

    if (answer.selectedOption === null || answer.selectedOption === undefined || answer.selectedOption === '') {
      unansweredCount += 1
    } else {
      // Compare objective answer
      const isCorrect = String(answer.selectedOption) === String(q.correctAnswer)
      if (isCorrect) {
        correctCount += 1
        subjectStats[subj].correct += 1
        topicStats[top].correct += 1
      } else {
        incorrectCount += 1
      }
    }
  }

  // Account for any questions in test not present in answers array
  const totalQuestionsInTest = dbQuestions.length
  const totalAnswersRecorded = testAttempt.answers.length
  if (totalAnswersRecorded < totalQuestionsInTest) {
    unansweredCount += (totalQuestionsInTest - totalAnswersRecorded)
  }

  const rawScore = (correctCount * marksPerQuestion) - (incorrectCount * negativeMarking)
  const maxScore = totalQuestionsInTest * marksPerQuestion
  const score = Math.max(0, rawScore)
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

  const subjectBreakdown = Object.entries(subjectStats).map(([subject, data]) => ({
    subject,
    totalQuestions: data.total,
    correctQuestions: data.correct,
    score: Math.max(0, (data.correct * marksPerQuestion) - ((data.total - data.correct) * negativeMarking)),
    percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
  }))

  const weakTopics = Object.entries(topicStats)
    .filter(([_, data]) => data.total > 0 && Math.round((data.correct / data.total) * 100) < 60)
    .map(([topic]) => topic)

  const timeTakenSeconds = Math.max(
    1,
    Math.round((Date.now() - new Date(testAttempt.startTime).getTime()) / 1000)
  )

  return {
    score,
    maxScore,
    percentage,
    correctCount,
    incorrectCount,
    unansweredCount,
    timeTakenSeconds,
    subjectBreakdown,
    weakTopics
  }
}
