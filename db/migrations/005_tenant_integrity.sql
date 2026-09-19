-- Defense-in-depth tenant integrity.
-- Application queries already scope by org_id; these constraints also make
-- cross-organization relationships invalid at the database layer.

ALTER TABLE campuses
  ADD CONSTRAINT campuses_org_id_id_unique UNIQUE (org_id, id);

ALTER TABLE students
  ADD CONSTRAINT students_org_id_id_unique UNIQUE (org_id, id);

ALTER TABLE cases
  ADD CONSTRAINT cases_org_id_id_unique UNIQUE (org_id, id);

ALTER TABLE virtual_sessions
  ADD CONSTRAINT virtual_sessions_org_id_id_unique UNIQUE (org_id, id);

ALTER TABLE students
  ADD CONSTRAINT students_campus_same_org_fk
  FOREIGN KEY (org_id, campus_id)
  REFERENCES campuses(org_id, id);

ALTER TABLE attendance_events
  ADD CONSTRAINT attendance_events_student_same_org_fk
  FOREIGN KEY (org_id, student_id)
  REFERENCES students(org_id, id);

ALTER TABLE attendance_daily
  ADD CONSTRAINT attendance_daily_student_same_org_fk
  FOREIGN KEY (org_id, student_id)
  REFERENCES students(org_id, id);

ALTER TABLE virtual_evidence_events
  ADD CONSTRAINT virtual_evidence_student_same_org_fk
  FOREIGN KEY (org_id, student_id)
  REFERENCES students(org_id, id);

ALTER TABLE cases
  ADD CONSTRAINT cases_student_same_org_fk
  FOREIGN KEY (org_id, student_id)
  REFERENCES students(org_id, id),
  ADD CONSTRAINT cases_campus_same_org_fk
  FOREIGN KEY (org_id, campus_id)
  REFERENCES campuses(org_id, id),
  ADD CONSTRAINT cases_owner_same_org_fk
  FOREIGN KEY (owner_user_id, org_id)
  REFERENCES memberships(user_id, org_id);

ALTER TABLE case_events
  ADD CONSTRAINT case_events_case_same_org_fk
  FOREIGN KEY (org_id, case_id)
  REFERENCES cases(org_id, id),
  ADD CONSTRAINT case_events_actor_same_org_fk
  FOREIGN KEY (actor_user_id, org_id)
  REFERENCES memberships(user_id, org_id);

ALTER TABLE commitments
  ADD CONSTRAINT commitments_case_same_org_fk
  FOREIGN KEY (org_id, case_id)
  REFERENCES cases(org_id, id),
  ADD CONSTRAINT commitments_owner_same_org_fk
  FOREIGN KEY (owner_user_id, org_id)
  REFERENCES memberships(user_id, org_id);

ALTER TABLE attendance_daily
  ADD CONSTRAINT attendance_daily_decider_same_org_fk
  FOREIGN KEY (decided_by, org_id)
  REFERENCES memberships(user_id, org_id);

ALTER TABLE imports
  ADD CONSTRAINT imports_uploader_same_org_fk
  FOREIGN KEY (uploaded_by, org_id)
  REFERENCES memberships(user_id, org_id);

ALTER TABLE notifications
  ADD CONSTRAINT notifications_student_same_org_fk
  FOREIGN KEY (org_id, student_id)
  REFERENCES students(org_id, id),
  ADD CONSTRAINT notifications_case_same_org_fk
  FOREIGN KEY (org_id, case_id)
  REFERENCES cases(org_id, id);

ALTER TABLE audit_logs
  ADD CONSTRAINT audit_logs_actor_same_org_fk
  FOREIGN KEY (actor_user_id, org_id)
  REFERENCES memberships(user_id, org_id);

ALTER TABLE invitations
  ADD CONSTRAINT invitations_inviter_same_org_fk
  FOREIGN KEY (invited_by, org_id)
  REFERENCES memberships(user_id, org_id);

ALTER TABLE password_reset_tokens
  ADD CONSTRAINT password_reset_membership_same_org_fk
  FOREIGN KEY (user_id, org_id)
  REFERENCES memberships(user_id, org_id);

ALTER TABLE virtual_sessions
  ADD CONSTRAINT virtual_sessions_campus_same_org_fk
  FOREIGN KEY (org_id, campus_id)
  REFERENCES campuses(org_id, id);

ALTER TABLE session_participation
  ADD CONSTRAINT session_participation_session_same_org_fk
  FOREIGN KEY (org_id, session_id)
  REFERENCES virtual_sessions(org_id, id),
  ADD CONSTRAINT session_participation_student_same_org_fk
  FOREIGN KEY (org_id, student_id)
  REFERENCES students(org_id, id);

ALTER TABLE checkin_tokens
  ADD CONSTRAINT checkin_tokens_student_same_org_fk
  FOREIGN KEY (org_id, student_id)
  REFERENCES students(org_id, id),
  ADD CONSTRAINT checkin_tokens_session_same_org_fk
  FOREIGN KEY (org_id, session_id)
  REFERENCES virtual_sessions(org_id, id),
  ADD CONSTRAINT checkin_tokens_case_same_org_fk
  FOREIGN KEY (org_id, case_id)
  REFERENCES cases(org_id, id);

ALTER TABLE checkin_responses
  ADD CONSTRAINT checkin_responses_student_same_org_fk
  FOREIGN KEY (org_id, student_id)
  REFERENCES students(org_id, id),
  ADD CONSTRAINT checkin_responses_session_same_org_fk
  FOREIGN KEY (org_id, session_id)
  REFERENCES virtual_sessions(org_id, id),
  ADD CONSTRAINT checkin_responses_case_same_org_fk
  FOREIGN KEY (org_id, case_id)
  REFERENCES cases(org_id, id);
