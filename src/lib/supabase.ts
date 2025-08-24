import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Specific data types for structured JSON data  
export interface AyahData {
  arabic: string
  translation: string
  reference: string
}

export interface PollData {
  type: 'options' | 'feedback'
  options?: string[]
  mood?: string
  feedback?: string
  role?: string
}

export interface Database {
  public: {
    Tables: {
      interactions: {
        Row: {
          answer_index: number | null
          created_at: string | null
          item_id: string
          type: 'like' | 'love' | 'vote' | 'bookmark' | 'seen' | 'thanks' | 'poll_vote'
          user_email: string
        }
        Insert: {
          answer_index?: number | null
          created_at?: string | null
          item_id: string
          type: 'like' | 'love' | 'vote' | 'bookmark' | 'seen' | 'thanks' | 'poll_vote'
          user_email: string
        }
        Update: {
          answer_index?: number | null
          created_at?: string | null
          item_id?: string
          type?: 'like' | 'love' | 'vote' | 'bookmark' | 'seen' | 'thanks' | 'poll_vote'
          user_email?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          author_email: string
          author_id: string | null
          body: string | null
          created_at: string | null
          data: Json | null
          end_at: string | null
          id: string
          is_deleted: boolean | null
          kind: 'post' | 'comment' | 'event' | 'ayah' | 'poll' | 'tip' | 'system'
          media_urls: string[] | null
          parent_id: string | null
          start_at: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          author_email: string
          author_id?: string | null
          body?: string | null
          created_at?: string | null
          data?: Json | null
          end_at?: string | null
          id?: string
          is_deleted?: boolean | null
          kind: 'post' | 'comment' | 'event' | 'ayah' | 'poll' | 'tip' | 'system'
          media_urls?: string[] | null
          parent_id?: string | null
          start_at?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          author_email?: string
          author_id?: string | null
          body?: string | null
          created_at?: string | null
          data?: Json | null
          end_at?: string | null
          id?: string
          is_deleted?: boolean | null
          kind?: 'post' | 'comment' | 'event' | 'ayah' | 'poll' | 'tip' | 'system'
          media_urls?: string[] | null
          parent_id?: string | null
          start_at?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          dob: string | null
          email: string
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          dob?: string | null
          email: string
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          dob?: string | null
          email?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          id: string
          question_text: string
          options: string[]
          order_index: number
        }
        Insert: {
          id?: string
          question_text: string
          options: string[]
          order_index: number
        }
        Update: {
          id?: string
          question_text?: string
          options?: string[]
          order_index?: number
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          id: string
          user_id: string | null
          question_id: string | null
          answer_index: number
          locked_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          question_id?: string | null
          answer_index: number
          locked_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          question_id?: string | null
          answer_index?: number
          locked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          }
        ]
      }
      quiz_guesses: {
        Row: {
          id: string
          guesser_id: string | null
          target_id: string | null
          question_id: string | null
          guessed_index: number
          created_at: string | null
        }
        Insert: {
          id?: string
          guesser_id?: string | null
          target_id?: string | null
          question_id?: string | null
          guessed_index: number
          created_at?: string | null
        }
        Update: {
          id?: string
          guesser_id?: string | null
          target_id?: string | null
          question_id?: string | null
          guessed_index?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_guesses_guesser_id_fkey"
            columns: ["guesser_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "quiz_guesses_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "quiz_guesses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          }
        ]
      }
      reflections: {
        Row: {
          id: string
          user_id: string | null
          mood_emoji: string
          reflection_text: string | null
          week_start: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          mood_emoji: string
          reflection_text?: string | null
          week_start: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          mood_emoji?: string
          reflection_text?: string | null
          week_start?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reflections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          }
        ]
      }
      scenario_questions: {
        Row: {
          id: string
          question_text: string
          options: string[]
          correct_index: number
          order_index: number
        }
        Insert: {
          id?: string
          question_text: string
          options: string[]
          correct_index: number
          order_index: number
        }
        Update: {
          id?: string
          question_text?: string
          options?: string[]
          correct_index?: number
          order_index?: number
        }
        Relationships: []
      }
      scenario_answers: {
        Row: {
          id: string
          user_id: string | null
          question_id: string | null
          chosen_index: number
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          question_id?: string | null
          chosen_index: number
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          question_id?: string | null
          chosen_index?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scenario_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "scenario_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "scenario_questions"
            referencedColumns: ["id"]
          }
        ]
      }
      islamic_questions: {
        Row: {
          id: string
          question_text: string
          options: string[]
          correct_index: number
          explanation_correct: string | null
          explanation_incorrect: string | null
          order_index: number
          category: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          question_text: string
          options: string[]
          correct_index: number
          explanation_correct?: string | null
          explanation_incorrect?: string | null
          order_index: number
          category?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          question_text?: string
          options?: string[]
          correct_index?: number
          explanation_correct?: string | null
          explanation_incorrect?: string | null
          order_index?: number
          category?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export const supabase = createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY)