---
title: A weekend with Whisper and Llama
date: 2025-11-08
excerpt: Building a voice agent that never leaves the laptop.
image:
---

The goal was a voice assistant with no cloud in the loop. Microphone in, speech out, everything on an M-series laptop.

## The pipeline

1. Capture audio and run voice activity detection to find speech.
2. Whisper for transcription, on device.
3. Llama 3.2 for the reply.
4. A small text to speech model for the voice.

## The hard part

Latency. Each stage is fine on its own; chained together they feel slow. The fix was to start transcribing before the speaker stops, and to let the model begin composing on a partial transcript.

Barge-in mattered more than I expected. If you talk over it, it should stop mid-word, not politely finish the sentence.
