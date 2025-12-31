import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import logger from "../logging/winston";
import {
  RESUME_ANALYSIS_PROMPT,
  RESUME_OPTIMIZATION_PROMPT,
  RESUME_FORMAT_PROMPT,
  COVER_LETTER_MATCHING_PROMPT,
  COVER_LETTER_PERSONALIZATION_PROMPT,
  COVER_LETTER_REFINEMENT_PROMPT,
} from "./prompts";

const model = new ChatAnthropic({
  modelName: "claude-sonnet-4-20250514",
  temperature: 0.3,
  maxTokens: 4096,
});

const outputParser = new StringOutputParser();

export function createResumeAnalysisChain() {
  const prompt = ChatPromptTemplate.fromTemplate(RESUME_ANALYSIS_PROMPT);

  return RunnableSequence.from([
    prompt,
    model,
    outputParser,
  ]);
}

export function createResumeOptimizationChain() {
  const prompt = ChatPromptTemplate.fromTemplate(RESUME_OPTIMIZATION_PROMPT);

  return RunnableSequence.from([
    prompt,
    model,
    outputParser,
  ]);
}

export function createResumeFormatChain() {
  const prompt = ChatPromptTemplate.fromTemplate(RESUME_FORMAT_PROMPT);

  return RunnableSequence.from([
    prompt,
    model,
    outputParser,
  ]);
}

export function createCoverLetterMatchingChain() {
  const prompt = ChatPromptTemplate.fromTemplate(COVER_LETTER_MATCHING_PROMPT);

  return RunnableSequence.from([
    prompt,
    model,
    outputParser,
  ]);
}

export function createCoverLetterPersonalizationChain() {
  const prompt = ChatPromptTemplate.fromTemplate(COVER_LETTER_PERSONALIZATION_PROMPT);

  return RunnableSequence.from([
    prompt,
    model,
    outputParser,
  ]);
}

export function createCoverLetterRefinementChain() {
  const prompt = ChatPromptTemplate.fromTemplate(COVER_LETTER_REFINEMENT_PROMPT);

  return RunnableSequence.from([
    prompt,
    model,
    outputParser,
  ]);
}


