-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.anonymous_pitches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pitch_interest;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_badges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_skills;

-- Insert default badges if they don't exist
INSERT INTO public.badges (name, description, icon, requirement) VALUES
('First Project', 'Created your first project', '🚀', 'create_project'),
('Team Player', 'Joined 3 projects', '🤝', 'join_3_projects'),
('Collaborator', 'Member of 5 projects', '👥', 'member_5_projects'),
('Pitch Master', 'Created 3 anonymous pitches', '💡', 'create_3_pitches'),
('Skilled Professional', 'Added 5 skills to profile', '⭐', 'add_5_skills'),
('Social Butterfly', 'Sent 10 messages', '💬', 'send_10_messages')
ON CONFLICT DO NOTHING;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION public.check_and_award_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id_to_check UUID;
  project_count INT;
  member_count INT;
  pitch_count INT;
  skill_count INT;
  message_count INT;
BEGIN
  -- Determine which user to check based on the trigger
  IF TG_TABLE_NAME = 'projects' THEN
    user_id_to_check := NEW.owner_id;
  ELSIF TG_TABLE_NAME = 'project_members' THEN
    user_id_to_check := NEW.user_id;
  ELSIF TG_TABLE_NAME = 'anonymous_pitches' THEN
    user_id_to_check := NEW.creator_id;
  ELSIF TG_TABLE_NAME = 'user_skills' THEN
    user_id_to_check := NEW.user_id;
  ELSIF TG_TABLE_NAME = 'messages' THEN
    user_id_to_check := NEW.sender_id;
  END IF;

  -- Check First Project badge
  SELECT COUNT(*) INTO project_count FROM public.projects WHERE owner_id = user_id_to_check;
  IF project_count >= 1 THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    SELECT user_id_to_check, id FROM public.badges WHERE requirement = 'create_project'
    ON CONFLICT DO NOTHING;
  END IF;

  -- Check Team Player badge (joined 3 projects)
  SELECT COUNT(*) INTO member_count FROM public.project_members WHERE user_id = user_id_to_check;
  IF member_count >= 3 THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    SELECT user_id_to_check, id FROM public.badges WHERE requirement = 'join_3_projects'
    ON CONFLICT DO NOTHING;
  END IF;

  -- Check Collaborator badge (member of 5 projects)
  IF member_count >= 5 THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    SELECT user_id_to_check, id FROM public.badges WHERE requirement = 'member_5_projects'
    ON CONFLICT DO NOTHING;
  END IF;

  -- Check Pitch Master badge
  SELECT COUNT(*) INTO pitch_count FROM public.anonymous_pitches WHERE creator_id = user_id_to_check;
  IF pitch_count >= 3 THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    SELECT user_id_to_check, id FROM public.badges WHERE requirement = 'create_3_pitches'
    ON CONFLICT DO NOTHING;
  END IF;

  -- Check Skilled Professional badge
  SELECT COUNT(*) INTO skill_count FROM public.user_skills WHERE user_id = user_id_to_check;
  IF skill_count >= 5 THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    SELECT user_id_to_check, id FROM public.badges WHERE requirement = 'add_5_skills'
    ON CONFLICT DO NOTHING;
  END IF;

  -- Check Social Butterfly badge
  SELECT COUNT(*) INTO message_count FROM public.messages WHERE sender_id = user_id_to_check;
  IF message_count >= 10 THEN
    INSERT INTO public.user_badges (user_id, badge_id)
    SELECT user_id_to_check, id FROM public.badges WHERE requirement = 'send_10_messages'
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers for badge awarding
CREATE TRIGGER award_badges_on_project
AFTER INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.check_and_award_badges();

CREATE TRIGGER award_badges_on_project_member
AFTER INSERT ON public.project_members
FOR EACH ROW EXECUTE FUNCTION public.check_and_award_badges();

CREATE TRIGGER award_badges_on_pitch
AFTER INSERT ON public.anonymous_pitches
FOR EACH ROW EXECUTE FUNCTION public.check_and_award_badges();

CREATE TRIGGER award_badges_on_skill
AFTER INSERT ON public.user_skills
FOR EACH ROW EXECUTE FUNCTION public.check_and_award_badges();

CREATE TRIGGER award_badges_on_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.check_and_award_badges();

-- Add unique constraint to user_badges to prevent duplicates
ALTER TABLE public.user_badges ADD CONSTRAINT user_badges_user_badge_unique UNIQUE (user_id, badge_id);