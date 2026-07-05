-- =============================================
-- Seed Skills L1-L5 (DRAFT — clinician review required)
-- From BUILD_PLAN.md §7 (updated with Ariella's input)
-- =============================================

-- Level 1: Connection & Foundation
INSERT INTO skills (slug, level, sort_order, title, goal, use_when, say_this, dont_say, safety_warning, age_adaptations, is_published) VALUES
(
  'validation-reflective-listening',
  1, 1,
  'Validation & Reflective Listening',
  'Show your child you understand their feelings before trying to fix anything.',
  'When your child is upset, frustrated, or sharing something emotional.',
  'I hear you. It sounds like you''re feeling [emotion] because [reason]. That makes sense.',
  'Stop crying. It''s not a big deal. You''re overreacting.',
  NULL,
  'Ages 3–5: Use simple emotion words (sad, mad, scared). Mirror their facial expressions. Ages 6–8: Can label more complex emotions (frustrated, embarrassed, disappointed). Ages 9–10: Can discuss feelings in depth and connect them to situations.',
  TRUE
),
(
  'labeled-praise',
  1, 2,
  'Labeled Praise',
  'Tell your child exactly what they did well so they know what to repeat.',
  'When your child does something positive, even small things.',
  'I noticed you [specific behavior]. That was really [quality]. For example, "You shared your toy with your sister — that was really generous."',
  'Good job. That''s nice. (vague praise without specifics)',
  NULL,
  'Ages 3–5: Praise immediately and enthusiastically. Keep it to one sentence. Ages 6–8: Can handle slightly longer praise. Connect effort to outcome. Ages 9–10: Acknowledge their independence and decision-making. Less enthusiasm, more genuine respect.',
  TRUE
),
(
  'special-time',
  1, 3,
  'Special Time (Child-Led Play)',
  'Build connection by following your child''s lead in play for 5-10 minutes.',
  'Daily, or when your child seems disconnected or needs attention.',
  'I''m all yours. You pick what we play. I''ll follow your lead. (Then narrate what they do: "You''re building a tower!" "You''re choosing the blue one!")',
  'Let''s play this. No, do it this way. That''s wrong. (directing or correcting during play)',
  NULL,
  'Ages 3–5: 5 minutes of floor play. Get on their level. Use simple narration. Ages 6–8: Can extend to 10 minutes. May prefer games over pretend play. Ages 9–10: May prefer activities (sports, cooking, building). Adapt "play" to their interests.',
  TRUE
);

-- Level 2: Shaping Behavior
INSERT INTO skills (slug, level, sort_order, title, goal, use_when, say_this, dont_say, safety_warning, age_adaptations, is_published) VALUES
(
  'active-ignoring',
  2, 4,
  'Active Ignoring (Planned Ignoring)',
  'Remove attention from minor misbehavior so it fades over time.',
  'For low-level annoying behaviors (whining, minor tantrums, begging) that are not dangerous.',
  'Stay calm. Look away or leave the room briefly. Do not engage. When the behavior stops, immediately praise any positive behavior that follows.',
  'Stop that! I told you no! (giving attention to the misbehavior)',
  '⚠️ SAFETY WARNING: Never ignore aggression, self-harm, destruction of property, or behaviors that put the child or others at risk. Active ignoring is ONLY for minor, non-dangerous behaviors.',
  'Ages 3–5: Brief ignoring (30 seconds). Redirect quickly once they stop. Ages 6–8: Can explain afterward why you ignored certain behavior. Ages 9–10: May need a brief conversation about why you chose not to engage.',
  TRUE
),
(
  'differential-attention',
  2, 5,
  'Differential Attention',
  'Give more attention to good behavior and less to unwanted behavior.',
  'Throughout the day, especially when multiple behaviors are happening.',
  'When your child behaves well, give enthusiastic attention (praise, smiles, engagement). When they misbehave calmly reduce attention. The contrast teaches them what earns your focus.',
  'Ignoring everything equally. Or only paying attention when there''s a problem.',
  NULL,
  'Ages 3–5: Contrast must be obvious (big praise vs. clear withdrawal). Ages 6–8: Can understand the pattern if explained simply. Ages 9–10: Can discuss the concept openly — "I notice great things when you..."',
  TRUE
),
(
  'first-then',
  2, 6,
  'First/Then',
  'Use a simple sequence to motivate compliance: "First [task], then [reward]."',
  'When you need your child to do something they don''t want to do (homework, chores, getting dressed).',
  'First [unpleasant task], then [preferred activity]. Example: "First homework, then iPad time." Keep it short and follow through.',
  'If you don''t do this, you''ll never get [reward]. (threats, long explanations)',
  NULL,
  'Ages 3–5: Use visual aids (picture cards). Keep tasks very short. Ages 6–8: Can handle 2–3 step sequences. Ages 9–10: Can negotiate the "then" and understand delayed gratification better.',
  TRUE
);

-- Level 3: Limits & Boundaries
INSERT INTO skills (slug, level, sort_order, title, goal, use_when, say_this, dont_say, safety_warning, age_adaptations, is_published) VALUES
(
  'effective-commands',
  3, 7,
  'Effective Commands',
  'Give clear, calm, one-step commands that your child can actually follow.',
  'Whenever you need your child to do something.',
  'Get your shoes on. (One clear command. Calm tone. Eye level if possible.) Wait 5 seconds for compliance before repeating once.',
  'Can you please maybe go get your shoes? Why aren''t you listening? How many times do I have to tell you? (long-wrapped, angry, or multiple commands at once)',
  NULL,
  'Ages 3–5: One-step commands only. Use physical prompts if needed (guide their hand). Ages 6–8: Can follow 2-step directions. Give eye contact first. Ages 9–10: Can handle multi-step tasks. Explain the "why" briefly.',
  TRUE
),
(
  'natural-logical-consequences',
  3, 8,
  'Natural & Logical Consequences',
  'Let the natural result of behavior teach, or apply a related consequence calmly.',
  'When rules are broken or poor choices are made.',
  'Natural: If you don''t wear a coat, you''ll feel cold. (Let it happen.) Logical: If you throw the toy, the toy goes away for today. (Related, reasonable, stated calmly.)',
  'I told you so! This is what happens! (lecturing or rubbing it in)',
  NULL,
  'Ages 3–5: Use immediate, concrete consequences. Keep explanation minimal. Ages 6–8: Can understand "related" consequences. Involve them in problem-solving. Ages 9–10: Can help choose logical consequences. More discussion, less enforcement.',
  TRUE
),
(
  'limit-setting-consistency',
  3, 9,
  'Limit Setting & Consistency',
  'Set clear boundaries and follow through every time, even when it''s hard.',
  'When your child tests boundaries or when rules need to be established.',
  'State the rule once, calmly. Follow through every time. If they push back: "I understand you''re upset. The rule is still [rule]." Do not negotiate in the moment.',
  'Maybe later. We''ll see. Fine, just this once. (inconsistency erodes trust)',
  NULL,
  'Ages 3–5: Few rules, enforced consistently. Use visual reminders (chart on wall). Ages 6–8: Can help create family rules. Post them visibly. Ages 9–10: Negotiate some rules together. They need to understand the reasoning.',
  TRUE
),
(
  'effective-discipline-timeout',
  3, 10,
  'Effective Discipline & Time-Out Procedure',
  'Use time-out as a冷静 space for the child to reset, not as punishment.',
  'For behaviors that require immediate removal (hitting, throwing objects, extreme defiance).',
  'Time-out: [Behavior] is not okay. You need to take a break. Go to your spot for [age-appropriate time]. I''ll tell you when you can come back. (Calm, firm, no lectures.)',
  'Go to your room! You''re in big trouble! (angry, punitive tone)',
  '⚠️ SAFETY WARNING: Time-out should never be used for children under 2. Never lock a child in a room. Time-out spot should be boring but safe. Always follow up with a brief, calm reconnect after time-out.',
  'Ages 2–3: Not recommended. Use redirection instead. Ages 3–5: 1 minute per year of age. Simple explanation. Ages 6–8: Up to 5 minutes. Brief discussion after. Ages 9–10: Prefer "cool-down time" over formal time-out. Give them space to regulate.',
  TRUE
);

-- Level 4: Regulation (Phase 2)
INSERT INTO skills (slug, level, sort_order, title, goal, use_when, say_this, dont_say, safety_warning, age_adaptations, is_published) VALUES
(
  'parental-coping-skills',
  4, 11,
  'Parental Coping Skills',
  'Help parents manage their own stress so they can respond calmly to their child.',
  'When the parent feels overwhelmed, frustrated, or triggered by their child''s behavior.',
  'Pause. Take 3 deep breaths. Say to yourself: "This is hard, but I can handle it." Remind yourself: my child''s behavior is not about my worth as a parent.',
  'I can''t take this anymore. Why is this so hard? (spiraling into self-blame or frustration)',
  NULL,
  'Ages 3–5: Parents may need more frequent breaks. Shorter interactions. Ages 6–8: Can involve child in parent''s coping ("I''m taking a deep breath because I feel frustrated"). Ages 9–10: Model coping openly. Discuss emotions together.',
  TRUE
),
(
  'escalation-curve',
  4, 12,
  'Understanding the Escalation Curve',
  'Recognize the three phases of a meltdown (escalating, peak, cool down) and respond differently at each.',
  'During any behavioral escalation — tantrums, meltdowns, intense defiance.',
  'Escalating: Use calm voice, simple commands, reduce demands. Peak: Say little. Ensure safety. Limit verbalization. Do not reason or lecture. Cool down: Reconnect, brief acknowledgment, move on.',
  'Trying to reason during peak. Talking too much. Engaging in power struggles.',
  '⚠️ SAFETY WARNING: During peak escalation, prioritize safety. Remove dangerous objects. Stay nearby but do not physically restrain unless the child is in immediate danger. Never reason, lecture, or demand compliance at peak.',
  'Ages 3–5: Peak is shorter (2–5 min). Redirect quickly during cool down. Ages 6–8: Peak may last longer. Give space but stay visible. Ages 9–10: Peak can be intense. Respect their need for space after. Reconnect when they''re ready.',
  TRUE
);

-- Level 5: Support & Maintenance (Phase 2)
INSERT INTO skills (slug, level, sort_order, title, goal, use_when, say_this, dont_say, safety_warning, age_adaptations, is_published) VALUES
(
  'limiting-accommodations',
  5, 13,
  'Limiting Accommodations',
  'Reduce anxious avoidance by gradually exposing the child to discomfort.',
  'When the child avoids situations due to anxiety (school, social, specific fears).',
  'Start small. "Let''s try for 2 minutes." Gradually increase. Acknowledge the discomfort: "I know this is hard. I believe you can do it." Do not rescue or remove them from every uncomfortable situation.',
  'It''s okay, we don''t have to do it. (reinforcing avoidance)',
  NULL,
  'Ages 3–5: Very gradual exposure. One minute at a time. Use play to practice. Ages 6–8: Can understand "bravery steps." Celebrate small wins. Ages 9–10: Can set their own exposure goals. Involve them in planning.',
  TRUE
),
(
  'support-statements',
  5, 14,
  'Support Statements',
  'Provide encouragement that builds confidence and resilience.',
  'When the child is struggling, doubting themselves, or facing a challenge.',
  'I believe in you. You''ve done hard things before. I''m here if you need me, but I know you can handle this.',
  'You''ll be fine. Just try harder. Stop worrying. (dismissing their feelings)',
  NULL,
  'Ages 3–5: Simple, warm, physical (hug + "You can do it!"). Ages 6–8: Connect to past success ("Remember when you did X? Same thing."). Ages 9–10: Acknowledge complexity. "This is genuinely hard, and you''re handling it."',
  TRUE
),
(
  'reinforcements',
  5, 15,
  'Reinforcements',
  'Use rewards and recognition to strengthen desired behaviors over time.',
  'When building new habits or encouraging consistent positive behavior.',
  'Immediate praise + specific acknowledgment. Token economy or sticker charts for younger kids. For older kids: privileges, choices, verbal recognition.',
  'Bribing to stop bad behavior. Rewarding expected baseline behavior.',
  NULL,
  'Ages 3–5: Immediate rewards. Sticker charts work well. Keep tokens concrete. Ages 6–8: Can save for bigger rewards. Introduce point systems. Ages 9–10: Privileges work better than material rewards. Recognize their autonomy.',
  TRUE
),
(
  'managing-antecedents',
  5, 16,
  'Managing Antecedents',
  'Change the environment or situation BEFORE misbehavior happens to prevent it.',
  'When you notice patterns — certain times, places, or situations that trigger difficult behavior.',
  'Identify the trigger. Change the setup: "Before we go to the store, let''s review expectations." Prepare the child: "In 10 minutes, we''ll need to leave." Structure the environment to set them up for success.',
  'Being surprised by predictable behavior. Not planning ahead.',
  NULL,
  'Ages 3–5: Visual timers and social stories work well. Preview every transition. Ages 6–8: Can help identify their own triggers. "What makes it hard for you?" Ages 9–10: Collaborative problem-solving. "What can we change so this goes better?"',
  TRUE
);
