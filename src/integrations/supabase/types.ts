export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          browser: string | null
          country: string | null
          created_at: string | null
          device: string | null
          duration_ms: number | null
          event_type: string
          id: string
          is_bounce: boolean | null
          landing_path: string | null
          language: string | null
          os: string | null
          path: string | null
          project_slug: string | null
          referrer: string | null
          referrer_host: string | null
          screen: string | null
          scroll_depth: number | null
          session_id: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          value: Json | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          country?: string | null
          created_at?: string | null
          device?: string | null
          duration_ms?: number | null
          event_type: string
          id?: string
          is_bounce?: boolean | null
          landing_path?: string | null
          language?: string | null
          os?: string | null
          path?: string | null
          project_slug?: string | null
          referrer?: string | null
          referrer_host?: string | null
          screen?: string | null
          scroll_depth?: number | null
          session_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          value?: Json | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          country?: string | null
          created_at?: string | null
          device?: string | null
          duration_ms?: number | null
          event_type?: string
          id?: string
          is_bounce?: boolean | null
          landing_path?: string | null
          language?: string | null
          os?: string | null
          path?: string | null
          project_slug?: string | null
          referrer?: string | null
          referrer_host?: string | null
          screen?: string | null
          scroll_depth?: number | null
          session_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          value?: Json | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      assistant_kb: {
        Row: {
          acoes: Json
          ativo: boolean
          exemplos: string[]
          gatilhos: string[]
          id: string
          ordem: number
          palavras: string[]
          palavras_fortes: string[]
          pergunta: string
          relacionadas: string[]
          resposta: string
          status: string
          sugerir_em: string[]
          tema: string
          updated_at: string
        }
        Insert: {
          acoes?: Json
          ativo?: boolean
          exemplos?: string[]
          gatilhos?: string[]
          id: string
          ordem?: number
          palavras?: string[]
          palavras_fortes?: string[]
          pergunta: string
          relacionadas?: string[]
          resposta: string
          status?: string
          sugerir_em?: string[]
          tema: string
          updated_at?: string
        }
        Update: {
          acoes?: Json
          ativo?: boolean
          exemplos?: string[]
          gatilhos?: string[]
          id?: string
          ordem?: number
          palavras?: string[]
          palavras_fortes?: string[]
          pergunta?: string
          relacionadas?: string[]
          resposta?: string
          status?: string
          sugerir_em?: string[]
          tema?: string
          updated_at?: string
        }
        Relationships: []
      }
      assistant_unanswered: {
        Row: {
          created_at: string
          id: string
          path: string | null
          pergunta: string
        }
        Insert: {
          created_at?: string
          id?: string
          path?: string | null
          pergunta: string
        }
        Update: {
          created_at?: string
          id?: string
          path?: string | null
          pergunta?: string
        }
        Relationships: []
      }
      bewild_posts: {
        Row: {
          author: string
          body: string
          category: string | null
          cover_image: string | null
          created_at: string
          excerpt: string | null
          faq: Json
          featured: boolean
          id: string
          meta_description: string | null
          meta_title: string | null
          published: boolean
          published_at: string | null
          reading_time: number
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string
          body?: string
          category?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          faq?: Json
          featured?: boolean
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean
          published_at?: string | null
          reading_time?: number
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          body?: string
          category?: string | null
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          faq?: Json
          featured?: boolean
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean
          published_at?: string | null
          reading_time?: number
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_name: string | null
          author_role: string | null
          category: string | null
          content_html: string
          cover_alt: string | null
          cover_blur_data_url: string | null
          cover_url: string | null
          cover_url_md: string | null
          cover_url_sm: string | null
          created_at: string
          excerpt: string | null
          id: string
          og_image_url: string | null
          order_index: number | null
          published_at: string | null
          reading_minutes: number | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          slug: string
          subtitle: string | null
          tags: string[] | null
          title: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          author_name?: string | null
          author_role?: string | null
          category?: string | null
          content_html?: string
          cover_alt?: string | null
          cover_blur_data_url?: string | null
          cover_url?: string | null
          cover_url_md?: string | null
          cover_url_sm?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          og_image_url?: string | null
          order_index?: number | null
          published_at?: string | null
          reading_minutes?: number | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug: string
          subtitle?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          author_name?: string | null
          author_role?: string | null
          category?: string | null
          content_html?: string
          cover_alt?: string | null
          cover_blur_data_url?: string | null
          cover_url?: string | null
          cover_url_md?: string | null
          cover_url_sm?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          og_image_url?: string | null
          order_index?: number | null
          published_at?: string | null
          reading_minutes?: number | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string
          subtitle?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      crash_reports: {
        Row: {
          app_version: string | null
          extra: Json | null
          id: string
          kind: string
          message: string
          occurred_at: string
          received_at: string
          recovered: boolean
          route: string | null
          session_id: string | null
          stack: string | null
          user_agent: string | null
        }
        Insert: {
          app_version?: string | null
          extra?: Json | null
          id?: string
          kind: string
          message: string
          occurred_at: string
          received_at?: string
          recovered?: boolean
          route?: string | null
          session_id?: string | null
          stack?: string | null
          user_agent?: string | null
        }
        Update: {
          app_version?: string | null
          extra?: Json | null
          id?: string
          kind?: string
          message?: string
          occurred_at?: string
          received_at?: string
          recovered?: boolean
          route?: string | null
          session_id?: string | null
          stack?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      diagnostic_leads: {
        Row: {
          budget_range: string | null
          created_at: string
          email: string | null
          id: string
          internal_notes: string | null
          landing_path: string | null
          message: string | null
          name: string
          neighborhood: string | null
          property_type: string | null
          referrer: string | null
          scope: string[] | null
          square_meters: number | null
          status: string
          timeframe: string | null
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          whatsapp: string
        }
        Insert: {
          budget_range?: string | null
          created_at?: string
          email?: string | null
          id?: string
          internal_notes?: string | null
          landing_path?: string | null
          message?: string | null
          name: string
          neighborhood?: string | null
          property_type?: string | null
          referrer?: string | null
          scope?: string[] | null
          square_meters?: number | null
          status?: string
          timeframe?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          whatsapp: string
        }
        Update: {
          budget_range?: string | null
          created_at?: string
          email?: string | null
          id?: string
          internal_notes?: string | null
          landing_path?: string | null
          message?: string | null
          name?: string
          neighborhood?: string | null
          property_type?: string | null
          referrer?: string | null
          scope?: string[] | null
          square_meters?: number | null
          status?: string
          timeframe?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      edge_rate_limits: {
        Row: {
          hits: number
          key: string
          window_start: string
        }
        Insert: {
          hits?: number
          key: string
          window_start?: string
        }
        Update: {
          hits?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      faq_items: {
        Row: {
          answer: string
          created_at: string
          id: string
          order_index: number
          question: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          order_index?: number
          question: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          order_index?: number
          question?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      image_alt_texts: {
        Row: {
          alt: string
          created_at: string
          model: string | null
          updated_at: string
          url: string
        }
        Insert: {
          alt: string
          created_at?: string
          model?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          alt?: string
          created_at?: string
          model?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      integration_log: {
        Row: {
          created_at: string
          detail: Json | null
          event_name: string | null
          http_status: number | null
          id: number
          integration: string
          lead_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          detail?: Json | null
          event_name?: string | null
          http_status?: number | null
          id?: never
          integration: string
          lead_id?: string | null
          status: string
        }
        Update: {
          created_at?: string
          detail?: Json | null
          event_name?: string | null
          http_status?: number | null
          id?: never
          integration?: string
          lead_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_qualification_log: {
        Row: {
          changed_by: string | null
          changed_by_email: string | null
          created_at: string
          from_status: string | null
          id: string
          lead_id: string
          note: string | null
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          changed_by_email?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          lead_id: string
          note?: string | null
          to_status: string
        }
        Update: {
          changed_by?: string | null
          changed_by_email?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          lead_id?: string
          note?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_qualification_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          area_m2: number | null
          chaves: string | null
          consent_marketing: boolean | null
          created_at: string
          email: string | null
          event_id: string | null
          fbc: string | null
          fbclid: string | null
          fbp: string | null
          first_utm_campaign: string | null
          first_utm_medium: string | null
          first_utm_source: string | null
          form_path: string | null
          gclid: string | null
          id: string
          landing_path: string | null
          lead_source: string | null
          lives_in_sp: boolean | null
          location: string | null
          message: string | null
          name: string
          objetivo: string | null
          planta: string | null
          referrer: string | null
          status: string
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          whatsapp: string
        }
        Insert: {
          area_m2?: number | null
          chaves?: string | null
          consent_marketing?: boolean | null
          created_at?: string
          email?: string | null
          event_id?: string | null
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          first_utm_campaign?: string | null
          first_utm_medium?: string | null
          first_utm_source?: string | null
          form_path?: string | null
          gclid?: string | null
          id?: string
          landing_path?: string | null
          lead_source?: string | null
          lives_in_sp?: boolean | null
          location?: string | null
          message?: string | null
          name: string
          objetivo?: string | null
          planta?: string | null
          referrer?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          whatsapp: string
        }
        Update: {
          area_m2?: number | null
          chaves?: string | null
          consent_marketing?: boolean | null
          created_at?: string
          email?: string | null
          event_id?: string | null
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          first_utm_campaign?: string | null
          first_utm_medium?: string | null
          first_utm_source?: string | null
          form_path?: string | null
          gclid?: string | null
          id?: string
          landing_path?: string | null
          lead_source?: string | null
          lives_in_sp?: boolean | null
          location?: string | null
          message?: string | null
          name?: string
          objetivo?: string | null
          planta?: string | null
          referrer?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      nutricao_envios: {
        Row: {
          created_at: string
          email: string
          enviado_em: string | null
          erro: string | null
          id: string
          idempotency_key: string
          status: string
          template_data: Json
          tentativas: number
          teste: boolean
          trilha: string
        }
        Insert: {
          created_at?: string
          email: string
          enviado_em?: string | null
          erro?: string | null
          id?: string
          idempotency_key: string
          status?: string
          template_data: Json
          tentativas?: number
          teste?: boolean
          trilha: string
        }
        Update: {
          created_at?: string
          email?: string
          enviado_em?: string | null
          erro?: string | null
          id?: string
          idempotency_key?: string
          status?: string
          template_data?: Json
          tentativas?: number
          teste?: boolean
          trilha?: string
        }
        Relationships: []
      }
      partner_cases: {
        Row: {
          created_at: string
          partner_name: string
          project_slugs: string[]
          published: boolean
          quote_author: string | null
          quote_role: string | null
          quote_text: string | null
          slug: string
          stats: Json
          timeline: Json
          updated_at: string
          updated_on: string | null
        }
        Insert: {
          created_at?: string
          partner_name: string
          project_slugs?: string[]
          published?: boolean
          quote_author?: string | null
          quote_role?: string | null
          quote_text?: string | null
          slug: string
          stats?: Json
          timeline?: Json
          updated_at?: string
          updated_on?: string | null
        }
        Update: {
          created_at?: string
          partner_name?: string
          project_slugs?: string[]
          published?: boolean
          quote_author?: string | null
          quote_role?: string | null
          quote_text?: string | null
          slug?: string
          stats?: Json
          timeline?: Json
          updated_at?: string
          updated_on?: string | null
        }
        Relationships: []
      }
      partner_referrals: {
        Row: {
          client_name: string | null
          commission_amount: number | null
          commission_status: string
          company: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          contract_value: number | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          internal_notes: string | null
          landing_path: string | null
          message: string | null
          origin: string | null
          partner_name: string
          partner_type: string | null
          referrer: string | null
          region: string | null
          status: string
          units: string | null
          updated_at: string
          user_agent: string | null
          whatsapp: string
        }
        Insert: {
          client_name?: string | null
          commission_amount?: number | null
          commission_status?: string
          company?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          contract_value?: number | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          internal_notes?: string | null
          landing_path?: string | null
          message?: string | null
          origin?: string | null
          partner_name: string
          partner_type?: string | null
          referrer?: string | null
          region?: string | null
          status?: string
          units?: string | null
          updated_at?: string
          user_agent?: string | null
          whatsapp: string
        }
        Update: {
          client_name?: string | null
          commission_amount?: number | null
          commission_status?: string
          company?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          contract_value?: number | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          internal_notes?: string | null
          landing_path?: string | null
          message?: string | null
          origin?: string | null
          partner_name?: string
          partner_type?: string | null
          referrer?: string | null
          region?: string | null
          status?: string
          units?: string | null
          updated_at?: string
          user_agent?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      project_images: {
        Row: {
          alt: string
          blur_data_url: string | null
          caption: string | null
          created_at: string | null
          format: string | null
          id: string
          order_index: number | null
          project_id: string
          url: string
          url_md: string | null
          url_sm: string | null
        }
        Insert: {
          alt: string
          blur_data_url?: string | null
          caption?: string | null
          created_at?: string | null
          format?: string | null
          id?: string
          order_index?: number | null
          project_id: string
          url: string
          url_md?: string | null
          url_sm?: string | null
        }
        Update: {
          alt?: string
          blur_data_url?: string | null
          caption?: string | null
          created_at?: string | null
          format?: string | null
          id?: string
          order_index?: number | null
          project_id?: string
          url?: string
          url_md?: string | null
          url_sm?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          after_image_url: string | null
          area: string | null
          area_m2: number | null
          before_image_url: string | null
          before_text: string | null
          challenge: string | null
          cover_alt: string | null
          cover_blur_data_url: string | null
          cover_url: string | null
          cover_url_md: string | null
          cover_url_sm: string | null
          created_at: string | null
          duration: string | null
          em: string | null
          featured: boolean
          featured_order: number
          gallery_urls: string[]
          id: string
          intro: string | null
          location: string | null
          materials: string[] | null
          neighborhood: string | null
          number: string | null
          og_image_url: string | null
          order_index: number | null
          photographer: string | null
          portfolio_tags: string[]
          program: string | null
          project_type: string | null
          published: boolean
          ready_gallery_urls: string[]
          ready_image_url: string | null
          ready_items: string[]
          result_text: string | null
          scope: string[]
          seo_description: string | null
          seo_title: string | null
          slug: string
          solution: string | null
          sort_order: number
          status: string | null
          summary: string | null
          tag: string
          team: string | null
          testimonial: string | null
          testimonial_author: string | null
          title: string
          updated_at: string | null
          visible: boolean | null
          year: string | null
        }
        Insert: {
          after_image_url?: string | null
          area?: string | null
          area_m2?: number | null
          before_image_url?: string | null
          before_text?: string | null
          challenge?: string | null
          cover_alt?: string | null
          cover_blur_data_url?: string | null
          cover_url?: string | null
          cover_url_md?: string | null
          cover_url_sm?: string | null
          created_at?: string | null
          duration?: string | null
          em?: string | null
          featured?: boolean
          featured_order?: number
          gallery_urls?: string[]
          id?: string
          intro?: string | null
          location?: string | null
          materials?: string[] | null
          neighborhood?: string | null
          number?: string | null
          og_image_url?: string | null
          order_index?: number | null
          photographer?: string | null
          portfolio_tags?: string[]
          program?: string | null
          project_type?: string | null
          published?: boolean
          ready_gallery_urls?: string[]
          ready_image_url?: string | null
          ready_items?: string[]
          result_text?: string | null
          scope?: string[]
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          solution?: string | null
          sort_order?: number
          status?: string | null
          summary?: string | null
          tag: string
          team?: string | null
          testimonial?: string | null
          testimonial_author?: string | null
          title: string
          updated_at?: string | null
          visible?: boolean | null
          year?: string | null
        }
        Update: {
          after_image_url?: string | null
          area?: string | null
          area_m2?: number | null
          before_image_url?: string | null
          before_text?: string | null
          challenge?: string | null
          cover_alt?: string | null
          cover_blur_data_url?: string | null
          cover_url?: string | null
          cover_url_md?: string | null
          cover_url_sm?: string | null
          created_at?: string | null
          duration?: string | null
          em?: string | null
          featured?: boolean
          featured_order?: number
          gallery_urls?: string[]
          id?: string
          intro?: string | null
          location?: string | null
          materials?: string[] | null
          neighborhood?: string | null
          number?: string | null
          og_image_url?: string | null
          order_index?: number | null
          photographer?: string | null
          portfolio_tags?: string[]
          program?: string | null
          project_type?: string | null
          published?: boolean
          ready_gallery_urls?: string[]
          ready_image_url?: string | null
          ready_items?: string[]
          result_text?: string | null
          scope?: string[]
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          solution?: string | null
          sort_order?: number
          status?: string | null
          summary?: string | null
          tag?: string
          team?: string | null
          testimonial?: string | null
          testimonial_author?: string | null
          title?: string
          updated_at?: string | null
          visible?: boolean | null
          year?: string | null
        }
        Relationships: []
      }
      seo_404_log: {
        Row: {
          created_at: string
          first_seen_at: string
          hits: number
          id: number
          last_seen_at: string
          notes: string | null
          path: string
          reason: string | null
          redirect_to: string | null
          referrer: string | null
          resolved_at: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_seen_at?: string
          hits?: number
          id?: number
          last_seen_at?: string
          notes?: string | null
          path: string
          reason?: string | null
          redirect_to?: string | null
          referrer?: string | null
          resolved_at?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_seen_at?: string
          hits?: number
          id?: number
          last_seen_at?: string
          notes?: string | null
          path?: string
          reason?: string | null
          redirect_to?: string | null
          referrer?: string | null
          resolved_at?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      seo_audit_log: {
        Row: {
          created_at: string | null
          id: number
          issues: Json | null
          kind: string
          notes: string | null
          score: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          issues?: Json | null
          kind: string
          notes?: string | null
          score?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          issues?: Json | null
          kind?: string
          notes?: string | null
          score?: number | null
        }
        Relationships: []
      }
      seo_index_runs: {
        Row: {
          checked: number
          errors: number
          id: number
          newly_indexed: number
          notes: string | null
          ran_at: string
          source: string
          urls_total: number
        }
        Insert: {
          checked?: number
          errors?: number
          id?: number
          newly_indexed?: number
          notes?: string | null
          ran_at?: string
          source?: string
          urls_total?: number
        }
        Update: {
          checked?: number
          errors?: number
          id?: number
          newly_indexed?: number
          notes?: string | null
          ran_at?: string
          source?: string
          urls_total?: number
        }
        Relationships: []
      }
      seo_index_status: {
        Row: {
          acknowledged_at: string | null
          changed_at: string | null
          coverage_state: string | null
          error: string | null
          first_seen_at: string
          id: number
          indexed: boolean
          indexed_at: string | null
          last_checked_at: string | null
          last_crawl_at: string | null
          previous_verdict: string | null
          removed: boolean
          robots_state: string | null
          updated_at: string
          url: string
          verdict: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          changed_at?: string | null
          coverage_state?: string | null
          error?: string | null
          first_seen_at?: string
          id?: number
          indexed?: boolean
          indexed_at?: string | null
          last_checked_at?: string | null
          last_crawl_at?: string | null
          previous_verdict?: string | null
          removed?: boolean
          robots_state?: string | null
          updated_at?: string
          url: string
          verdict?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          changed_at?: string | null
          coverage_state?: string | null
          error?: string | null
          first_seen_at?: string
          id?: number
          indexed?: boolean
          indexed_at?: string | null
          last_checked_at?: string | null
          last_crawl_at?: string | null
          previous_verdict?: string | null
          removed?: boolean
          robots_state?: string | null
          updated_at?: string
          url?: string
          verdict?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          address_city: string | null
          address_region: string | null
          address_street: string | null
          bastidores_seo: Json
          bing_site_verification: string | null
          business_founding_year: string | null
          business_opening_hours: string | null
          business_postal_code: string | null
          business_price_range: string | null
          business_type: string | null
          cau: string | null
          clarity_id: string | null
          cnpj: string | null
          contact_email: string | null
          contact_phone: string | null
          default_og_image: string | null
          facebook_domain_verification: string | null
          google_ads_contact_label: string | null
          google_ads_conversion_id: string | null
          google_ads_lead_label: string | null
          google_analytics_id: string | null
          google_business_profile_url: string | null
          google_maps_url: string | null
          google_site_verification: string | null
          google_tag_manager_id: string | null
          home_og_description: string | null
          home_og_image: string | null
          home_og_title: string | null
          home_seo_description: string | null
          home_seo_title: string | null
          hotjar_id: string | null
          id: number
          instagram_url: string | null
          linkedin_url: string | null
          meta_capi_test_event_code: string | null
          meta_pixel_id: string | null
          pages_seo: Json
          pinterest_site_verification: string | null
          pinterest_url: string | null
          seo_author: string | null
          seo_canonical_base: string | null
          seo_custom_head_html: string | null
          seo_default_description: string | null
          seo_default_title: string | null
          seo_geo_placename: string | null
          seo_geo_position: string | null
          seo_geo_region: string | null
          seo_keywords: string | null
          seo_last_audit_at: string | null
          seo_last_search_console_submit: string | null
          seo_og_image: string | null
          seo_robots: string | null
          seo_twitter_handle: string | null
          site_description: string | null
          site_title: string | null
          updated_at: string | null
          whatsapp_number: string | null
          yandex_verification: string | null
        }
        Insert: {
          address_city?: string | null
          address_region?: string | null
          address_street?: string | null
          bastidores_seo?: Json
          bing_site_verification?: string | null
          business_founding_year?: string | null
          business_opening_hours?: string | null
          business_postal_code?: string | null
          business_price_range?: string | null
          business_type?: string | null
          cau?: string | null
          clarity_id?: string | null
          cnpj?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          default_og_image?: string | null
          facebook_domain_verification?: string | null
          google_ads_contact_label?: string | null
          google_ads_conversion_id?: string | null
          google_ads_lead_label?: string | null
          google_analytics_id?: string | null
          google_business_profile_url?: string | null
          google_maps_url?: string | null
          google_site_verification?: string | null
          google_tag_manager_id?: string | null
          home_og_description?: string | null
          home_og_image?: string | null
          home_og_title?: string | null
          home_seo_description?: string | null
          home_seo_title?: string | null
          hotjar_id?: string | null
          id?: number
          instagram_url?: string | null
          linkedin_url?: string | null
          meta_capi_test_event_code?: string | null
          meta_pixel_id?: string | null
          pages_seo?: Json
          pinterest_site_verification?: string | null
          pinterest_url?: string | null
          seo_author?: string | null
          seo_canonical_base?: string | null
          seo_custom_head_html?: string | null
          seo_default_description?: string | null
          seo_default_title?: string | null
          seo_geo_placename?: string | null
          seo_geo_position?: string | null
          seo_geo_region?: string | null
          seo_keywords?: string | null
          seo_last_audit_at?: string | null
          seo_last_search_console_submit?: string | null
          seo_og_image?: string | null
          seo_robots?: string | null
          seo_twitter_handle?: string | null
          site_description?: string | null
          site_title?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
          yandex_verification?: string | null
        }
        Update: {
          address_city?: string | null
          address_region?: string | null
          address_street?: string | null
          bastidores_seo?: Json
          bing_site_verification?: string | null
          business_founding_year?: string | null
          business_opening_hours?: string | null
          business_postal_code?: string | null
          business_price_range?: string | null
          business_type?: string | null
          cau?: string | null
          clarity_id?: string | null
          cnpj?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          default_og_image?: string | null
          facebook_domain_verification?: string | null
          google_ads_contact_label?: string | null
          google_ads_conversion_id?: string | null
          google_ads_lead_label?: string | null
          google_analytics_id?: string | null
          google_business_profile_url?: string | null
          google_maps_url?: string | null
          google_site_verification?: string | null
          google_tag_manager_id?: string | null
          home_og_description?: string | null
          home_og_image?: string | null
          home_og_title?: string | null
          home_seo_description?: string | null
          home_seo_title?: string | null
          hotjar_id?: string | null
          id?: number
          instagram_url?: string | null
          linkedin_url?: string | null
          meta_capi_test_event_code?: string | null
          meta_pixel_id?: string | null
          pages_seo?: Json
          pinterest_site_verification?: string | null
          pinterest_url?: string | null
          seo_author?: string | null
          seo_canonical_base?: string | null
          seo_custom_head_html?: string | null
          seo_default_description?: string | null
          seo_default_title?: string | null
          seo_geo_placename?: string | null
          seo_geo_position?: string | null
          seo_geo_region?: string | null
          seo_keywords?: string | null
          seo_last_audit_at?: string | null
          seo_last_search_console_submit?: string | null
          seo_og_image?: string | null
          seo_robots?: string | null
          seo_twitter_handle?: string | null
          site_description?: string | null
          site_title?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
          yandex_verification?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      analytics_daily: {
        Row: {
          day: string | null
          event_type: string | null
          events: number | null
          sessions: number | null
        }
        Relationships: []
      }
      analytics_sessions: {
        Row: {
          conversions: number | null
          converted: boolean | null
          country: string | null
          device: string | null
          duration_s: number | null
          ended_at: string | null
          engagement_ms: number | null
          is_bounce: boolean | null
          landing_path: string | null
          pageviews: number | null
          referrer_host: string | null
          session_id: string | null
          started_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      analytics_breakdown: {
        Args: {
          p_dim: string
          p_limit?: number
          p_since: string
          p_until: string
        }
        Returns: {
          avg_duration_s: number
          bounce_rate: number
          conversions: number
          dim: string
          sessions: number
        }[]
      }
      analytics_funnel: {
        Args: { p_since: string; p_steps: string[]; p_until: string }
        Returns: {
          event_type: string
          sessions: number
          step: number
        }[]
      }
      analytics_hours_dow: {
        Args: {
          p_country?: string
          p_device?: string
          p_landing_path?: string
          p_referrer_host?: string
          p_since: string
          p_until: string
          p_utm_campaign?: string
          p_utm_medium?: string
          p_utm_source?: string
        }
        Returns: {
          dow: number
          hour: number
          sessions: number
        }[]
      }
      analytics_overview_kpis: {
        Args: {
          p_country?: string
          p_device?: string
          p_landing_path?: string
          p_referrer_host?: string
          p_since: string
          p_until: string
          p_utm_campaign?: string
          p_utm_medium?: string
          p_utm_source?: string
        }
        Returns: {
          avg_engagement_ms: number
          bounce_rate: number
          conversion_rate: number
          conversions: number
          pages_per_session: number
          pageviews: number
          sessions: number
          spark: Json
          unique_visitors: number
        }[]
      }
      analytics_realtime: {
        Args: never
        Returns: {
          minute: string
          pageviews: number
          sessions: number
        }[]
      }
      analytics_retention: {
        Args: { p_since: string; p_weeks?: number }
        Returns: {
          cohort_week: string
          visitors: number
          week_offset: number
        }[]
      }
      analytics_timeseries: {
        Args: { p_grain?: string; p_since: string; p_until: string }
        Returns: {
          bucket: string
          conversions: number
          pageviews: number
          sessions: number
        }[]
      }
      analytics_timeseries_v2: {
        Args: {
          p_country?: string
          p_device?: string
          p_grain: string
          p_landing_path?: string
          p_referrer_host?: string
          p_since: string
          p_tz: string
          p_until: string
          p_utm_campaign?: string
          p_utm_medium?: string
          p_utm_source?: string
        }
        Returns: {
          bucket: string
          conversions: number
          pageviews: number
          sessions: number
          visitors: number
        }[]
      }
      analytics_top_paths_v2: {
        Args: {
          p_country?: string
          p_device?: string
          p_landing_path?: string
          p_limit?: number
          p_referrer_host?: string
          p_since: string
          p_until: string
          p_utm_campaign?: string
          p_utm_medium?: string
          p_utm_source?: string
        }
        Returns: {
          pageviews: number
          path: string
          sessions: number
        }[]
      }
      analytics_top_projects_v2: {
        Args: {
          p_country?: string
          p_device?: string
          p_landing_path?: string
          p_limit?: number
          p_referrer_host?: string
          p_since: string
          p_until: string
          p_utm_campaign?: string
          p_utm_medium?: string
          p_utm_source?: string
        }
        Returns: {
          project_slug: string
          sessions: number
          views: number
        }[]
      }
      hit_rate_limit: {
        Args: { p_key: string; p_max: number; p_window_s: number }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      log_404: {
        Args: { p_path: string; p_reason?: string; p_referrer?: string }
        Returns: undefined
      }
      resolve_404_redirect: { Args: { p_path: string }; Returns: string }
      top_projects: {
        Args: { p_days?: number; p_limit?: number }
        Returns: {
          area_m2: number
          cover_url: string
          duration: string
          id: string
          location: string
          neighborhood: string
          project_type: string
          slug: string
          title: string
          views: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
