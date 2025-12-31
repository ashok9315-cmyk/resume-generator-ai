"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResumeAnalysisChain = createResumeAnalysisChain;
exports.createResumeOptimizationChain = createResumeOptimizationChain;
exports.createResumeFormatChain = createResumeFormatChain;
exports.createCoverLetterMatchingChain = createCoverLetterMatchingChain;
exports.createCoverLetterPersonalizationChain = createCoverLetterPersonalizationChain;
exports.createCoverLetterRefinementChain = createCoverLetterRefinementChain;
const anthropic_1 = require("@langchain/anthropic");
const prompts_1 = require("@langchain/core/prompts");
const output_parsers_1 = require("@langchain/core/output_parsers");
const runnables_1 = require("@langchain/core/runnables");
const prompts_2 = require("./prompts");
const model = new anthropic_1.ChatAnthropic({
    modelName: "claude-sonnet-4-20250514",
    temperature: 0.3,
    maxTokens: 4096,
});
const outputParser = new output_parsers_1.StringOutputParser();
function createResumeAnalysisChain() {
    const prompt = prompts_1.ChatPromptTemplate.fromTemplate(prompts_2.RESUME_ANALYSIS_PROMPT);
    return runnables_1.RunnableSequence.from([
        prompt,
        model,
        outputParser,
    ]);
}
function createResumeOptimizationChain() {
    const prompt = prompts_1.ChatPromptTemplate.fromTemplate(prompts_2.RESUME_OPTIMIZATION_PROMPT);
    return runnables_1.RunnableSequence.from([
        prompt,
        model,
        outputParser,
    ]);
}
function createResumeFormatChain() {
    const prompt = prompts_1.ChatPromptTemplate.fromTemplate(prompts_2.RESUME_FORMAT_PROMPT);
    return runnables_1.RunnableSequence.from([
        prompt,
        model,
        outputParser,
    ]);
}
function createCoverLetterMatchingChain() {
    const prompt = prompts_1.ChatPromptTemplate.fromTemplate(prompts_2.COVER_LETTER_MATCHING_PROMPT);
    return runnables_1.RunnableSequence.from([
        prompt,
        model,
        outputParser,
    ]);
}
function createCoverLetterPersonalizationChain() {
    const prompt = prompts_1.ChatPromptTemplate.fromTemplate(prompts_2.COVER_LETTER_PERSONALIZATION_PROMPT);
    return runnables_1.RunnableSequence.from([
        prompt,
        model,
        outputParser,
    ]);
}
function createCoverLetterRefinementChain() {
    const prompt = prompts_1.ChatPromptTemplate.fromTemplate(prompts_2.COVER_LETTER_REFINEMENT_PROMPT);
    return runnables_1.RunnableSequence.from([
        prompt,
        model,
        outputParser,
    ]);
}
