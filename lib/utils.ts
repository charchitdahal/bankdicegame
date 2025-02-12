import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Create a custom ID generator that uses lowercase letters and animals
export const animals = [
  'panda', 'tiger', 'lion', 'zebra', 'elephant', 'giraffe', 'penguin', 'koala',
  'kangaroo', 'dolphin', 'whale', 'octopus', 'monkey', 'gorilla', 'bear', 'wolf',
  'fox', 'rabbit', 'deer', 'moose', 'owl', 'eagle', 'hawk', 'peacock'
] as const;

export const adjectives = [
  'happy', 'lucky', 'silly', 'clever', 'swift', 'brave', 'bright', 'calm',
  'eager', 'fair', 'kind', 'proud', 'wise', 'warm', 'wild', 'bold',
  'cool', 'free', 'neat', 'nice', 'safe', 'soft', 'true', 'keen'
] as const;

export function generateGameId(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adjective}-${animal}`;
}