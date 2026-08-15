export type Lang = 'zh-CN' | 'en';

export type TranslationKey =
  | 'app.title'
  | 'nav.dashboard' | 'nav.risk' | 'nav.tasks' | 'nav.diary' | 'nav.habits' | 'nav.memories' | 'nav.emotion' | 'nav.therapy' | 'nav.reports' | 'nav.settings' | 'nav.sync'
  | 'nav.assistant' | 'nav.knowledge' | 'nav.resources' | 'nav.assessment'
<<<<<<< HEAD
  | 'nav.about'
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  | 'nav.data_local'
  | 'nav.group_daily' | 'nav.group_analysis' | 'nav.group_tools' | 'nav.group_system'
  | 'chat.offline_mode' | 'chat.cloud_mode' | 'chat.welcome' | 'chat.input_placeholder' | 'chat.disclaimer'
  | 'chat.suggest_diary' | 'chat.suggest_breathing' | 'chat.suggest_assessment'
  | 'chat.settings_title' | 'chat.settings_desc' | 'chat.provider' | 'chat.api_key' | 'chat.api_key_placeholder'
  | 'chat.test_connection' | 'chat.testing' | 'chat.test_success' | 'chat.test_fail' | 'chat.no_key' | 'chat.save_key'
<<<<<<< HEAD
  | 'chat.model_name' | 'chat.save_model'
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  | 'sync.title' | 'sync.description' | 'sync.scan_to_connect'
  | 'sync.server_status_running' | 'sync.server_status_stopped'
  | 'sync.start_server' | 'sync.stop_server'
  | 'sync.network_info' | 'sync.ip_address' | 'sync.port'
  | 'sync.no_synced_items' | 'sync.received_items'
  | 'header.quick_capture'
  | 'quick_capture.title' | 'quick_capture.placeholder' | 'quick_capture.save' | 'quick_capture.cancel'
  | 'quick_capture.todo' | 'quick_capture.diary' | 'quick_capture.idea' | 'quick_capture.memory'
  | 'quick_capture.uncategorized' | 'quick_capture.auto_classify'
  | 'quick_capture.saved_as' | 'quick_capture.hint'
  | 'assistant.title' | 'assistant.placeholder' | 'assistant.send'
  | 'assistant.loading' | 'assistant.welcome_title' | 'assistant.welcome_desc' | 'assistant.error'
  | 'assistant.suggest_analyze' | 'assistant.suggest_status' | 'assistant.suggest_help'
  | 'assistant.clear'
  | 'welcome.title' | 'welcome.subtitle' | 'welcome.select_lang' | 'welcome.start'
  | 'welcome.zh_desc' | 'welcome.en_desc'
  | 'task.title' | 'task.input_placeholder' | 'task.all' | 'task.pending' | 'task.completed' | 'task.overdue'
  | 'task.urgent' | 'task.high' | 'task.medium' | 'task.low'
  | 'task.rolled_over' | 'task.from' | 'task.expired' | 'task.detail' | 'task.delete' | 'task.save' | 'task.cancel'
  | 'task.no_tasks' | 'task.no_tasks_desc' | 'task.loading'
  | 'task.today' | 'task.yesterday' | 'task.tomorrow'
  | 'task.stats.all' | 'task.stats.today' | 'task.stats.pending' | 'task.stats.completed' | 'task.stats.rollover'
  | 'task.rolled_to_tomorrow' | 'task.pending_rollover' | 'task.title_required'
  | 'diary.title' | 'diary.write' | 'diary.no_entries' | 'diary.no_entries_desc' | 'diary.write_first'
<<<<<<< HEAD
  | 'diary.title_placeholder' | 'diary.content_placeholder' | 'diary.weather' | 'diary.tags' | 'diary.save' | 'diary.update' | 'diary.cancel'
=======
  | 'diary.title_placeholder' | 'diary.content_placeholder' | 'diary.weather' | 'diary.save' | 'diary.update' | 'diary.cancel'
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  | 'diary.back' | 'diary.save_emotion_fail'
  | 'habit.title' | 'habit.create' | 'habit.no_habits' | 'habit.no_habits_desc'
  | 'habit.name' | 'habit.name_placeholder' | 'habit.desc' | 'habit.color' | 'habit.create_btn' | 'habit.cancel'
  | 'habit.log' | 'habit.logged' | 'habit.streak_days'
  | 'memory.title' | 'memory.create' | 'memory.edit' | 'memory.no_memories' | 'memory.no_memories_desc'
<<<<<<< HEAD
  | 'memory.description' | 'memory.go_diary' | 'memory.go_chat'
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  | 'memory.search_placeholder' | 'memory.all_categories' | 'memory.title_placeholder' | 'memory.content_placeholder'
  | 'memory.type' | 'memory.source' | 'memory.category' | 'memory.tags' | 'memory.save' | 'memory.update' | 'memory.cancel'
  | 'memory.manual' | 'memory.idea' | 'memory.insight' | 'memory.diary_extract' | 'memory.bookmark' | 'memory.other'
  | 'report.title' | 'report.daily' | 'report.weekly' | 'report.monthly'
  | 'report.task_rate' | 'report.tasks_done' | 'report.diary_days' | 'report.mood_avg' | 'report.habit_rate' | 'report.word_count'
  | 'report.task_chart' | 'report.mood_chart' | 'report.habit_chart'
  | 'report.total' | 'report.completed'
  | 'report.loading' | 'report.select_hint'
  | 'report.ai_report' | 'report.insights' | 'report.suggestions' | 'report.health_radar' | 'report.emotion_trend' | 'report.no_emotion_data'
<<<<<<< HEAD
  | 'report.view_emotion_page' | 'report.latest_habit_day'
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  | 'report.no_data' | 'report.today' | 'report.avg_rate' | 'report.trend'
  | 'settings.title' | 'settings.data_mgmt' | 'settings.data_desc' | 'settings.export' | 'settings.import'
  | 'settings.storage_info' | 'settings.storage_desc' | 'settings.about' | 'settings.about_desc'
  | 'settings.model_status' | 'settings.model_status_desc' | 'settings.demo_data' | 'settings.demo_data_desc' | 'settings.demo_data_btn' | 'settings.demo_data_confirm' | 'settings.demo_data_success' | 'settings.demo_data_fail'
  | 'settings.open_folder' | 'settings.reset' | 'settings.reset_confirm'
  | 'settings.theme' | 'settings.theme_system' | 'settings.theme_light' | 'settings.theme_dark'
  | 'settings.shortcuts' | 'settings.shortcuts_desc'
  | 'settings.shortcuts_quick_capture' | 'settings.shortcuts_export' | 'settings.shortcuts_import'
  | 'settings.shortcuts_press_keys' | 'settings.shortcuts_conflict' | 'settings.shortcuts_confirm' | 'settings.shortcuts_reset'
  | 'settings.ai' | 'settings.ai_desc' | 'settings.ai_tone'
  | 'settings.ai_tone_professional' | 'settings.ai_tone_friendly' | 'settings.ai_tone_concise' | 'settings.ai_tone_encouraging'
  | 'settings.ai_tone_counselor'
  | 'settings.ai_mode_online' | 'settings.ai_mode_offline' | 'settings.ai_offline_tip'
  | 'settings.ai_provider' | 'settings.ai_api_key' | 'settings.ai_api_key_placeholder'
  | 'settings.ai_model'
  | 'notification.title' | 'notification.test' | 'notification.add' | 'notification.cancel'
  | 'notification.diary' | 'notification.habit' | 'notification.custom'
  | 'notification.title_placeholder' | 'notification.body_placeholder'
  | 'notification.empty' | 'notification.desc'
  | 'settings.online_model_title' | 'settings.online_model_desc' | 'settings.online_provider' | 'settings.online_model_hint'
  | 'mode_selection.title' | 'mode_selection.online' | 'mode_selection.online_desc'
  | 'mode_selection.offline' | 'mode_selection.offline_desc' | 'mode_selection.hint'
  | 'model_download.title' | 'model_download.select' | 'model_download.loading'
  | 'model_download.use_model' | 'model_download.selected'
  | 'model_download.path' | 'model_download.cancel'
  | 'dashboard.welcome' | 'dashboard.today_overview' | 'dashboard.today_todos' | 'dashboard.no_todos'
  | 'dashboard.habit_summary' | 'dashboard.no_habits' | 'dashboard.completed'
  | 'dashboard.mood_trend' | 'dashboard.recent_diary' | 'dashboard.view_all'
  | 'dashboard.task_progress' | 'dashboard.habit_progress'
  | 'dashboard.stats_today_task' | 'dashboard.stats_week_task' | 'dashboard.stats_week_diary' | 'dashboard.stats_habits'
  | 'dashboard.today_diary' | 'dashboard.no_diary_today' | 'dashboard.write_diary' | 'dashboard.diary_preview'
  | 'dashboard.habit_checkin' | 'dashboard.study_checkin' | 'dashboard.week_goal'
  | 'dashboard.weekly_review_entries'
  | 'dashboard.daily_quote' | 'dashboard.edit_quote' | 'dashboard.add_quote' | 'dashboard.delete_quote'
  | 'dashboard.quote_author' | 'dashboard.quote_placeholder'
  | 'common.confirm' | 'common.cancel' | 'common.delete' | 'common.save' | 'common.edit' | 'common.search' | 'common.loading'
  | 'common.backup_success' | 'common.backup_fail' | 'common.import_success' | 'common.import_fail' | 'common.delete_confirm'
  | 'common.save_fail' | 'common.delete_fail' | 'common.copy_fail'
  | 'common.empty_title' | 'common.empty_desc' | 'common.load_more'
  | 'common.clickable_card' | 'common.tag_input' | 'common.add_tag' | 'common.remove_tag' | 'common.tag_placeholder'
  | 'common.search_placeholder' | 'common.feedback_thanks' | 'common.feedback_accurate' | 'common.feedback_inaccurate'
  | 'common.feedback_ask' | 'common.loading_label'
  | 'task.title_label' | 'task.description_label' | 'task.priority_label' | 'task.scheduled_date_label' | 'task.tags_label'
  | 'task.status_filter' | 'task.priority_filter'
  | 'task.rollover_notice' | 'task.more' | 'task.rollover_banner'
  | 'task.new_task' | 'task.create' | 'task.repeat_toggle' | 'task.repeat_interval' | 'task.repeat_end'
  | 'diary.weather_placeholder' | 'diary.tags_placeholder' | 'diary.loading'
  | 'habit.daily' | 'habit.times' | 'habit.loading'
  | 'memory.title_label' | 'memory.content_label' | 'memory.type_label' | 'memory.category_label' | 'memory.category_header'
  | 'memory.source_label' | 'memory.source_placeholder' | 'memory.tags_label' | 'memory.default_category' | 'memory.loading' | 'memory.all'
  | 'memory.all_memories' | 'memory.candidates'
  | 'memory.candidates_empty' | 'memory.candidates_empty_desc'
  | 'memory.candidates_select_all' | 'memory.candidates_confirm' | 'memory.candidates_reject'
  | 'memory.candidates_source_diary' | 'memory.candidates_source_task' | 'memory.candidates_source_capture'
  | 'memory.candidates_scan' | 'memory.candidates_found' | 'memory.candidates_none' | 'memory.candidates_error'
  | 'memory.candidates_ai_toggle' | 'memory.candidates_ai_scan'
  | 'mood.1' | 'mood.2' | 'mood.3' | 'mood.4' | 'mood.5'
  | 'common.hint'
  | 'quick_capture.type_label'
  | 'crisis.title' | 'crisis.subtitle' | 'crisis.description_1' | 'crisis.description_2'
  | 'crisis.description_3' | 'crisis.description_4'
  | 'crisis.hotline_title' | 'crisis.online_counseling' | 'crisis.close_button'
  | 'crisis.countdown' | 'crisis.aria_label'
  | 'crisis.hotline_national_name' | 'crisis.hotline_national_desc'
  | 'crisis.hotline_beijing_name' | 'crisis.hotline_beijing_desc'
  | 'crisis.hotline_life_name' | 'crisis.hotline_life_desc'
  | 'crisis.hotline_hope_name' | 'crisis.hotline_hope_desc'
  | 'crisis.online_link_cas_label' | 'crisis.online_link_bj_label'
  | 'therapy.tr_title' | 'therapy.tr_subtitle' | 'therapy.tr_step_prev' | 'therapy.tr_step_next'
  | 'therapy.tr_step_save' | 'therapy.tr_step_saving' | 'therapy.tr_saved_title' | 'therapy.tr_saved_subtitle'
  | 'therapy.tr_saved_desc' | 'therapy.tr_saved_decreased' | 'therapy.tr_write_another' | 'therapy.tr_back'
  | 'therapy.tr_step0_title' | 'therapy.tr_step0_desc' | 'therapy.tr_step0_hint' | 'therapy.tr_step0_label' | 'therapy.tr_step0_ph'
  | 'therapy.tr_step1_title' | 'therapy.tr_step1_desc' | 'therapy.tr_step1_hint' | 'therapy.tr_step1_label' | 'therapy.tr_step1_ph'
  | 'therapy.tr_step1_distortion_hint'
  | 'therapy.tr_step2_title' | 'therapy.tr_step2_desc' | 'therapy.tr_step2_hint' | 'therapy.tr_step2_intensity' | 'therapy.tr_step2_intensity_label'
  | 'therapy.tr_step2_intensity_min' | 'therapy.tr_step2_intensity_max'
  | 'therapy.tr_step3_title' | 'therapy.tr_step3_desc' | 'therapy.tr_step3_hint' | 'therapy.tr_step3_for_label' | 'therapy.tr_step3_for_ph'
  | 'therapy.tr_step3_against_label' | 'therapy.tr_step3_against_ph'
  | 'therapy.tr_step4_title' | 'therapy.tr_step4_desc' | 'therapy.tr_step4_hint' | 'therapy.tr_step4_label' | 'therapy.tr_step4_ph'
  | 'therapy.tr_step4_new_intensity' | 'therapy.tr_step4_decreased_to'
  | 'therapy.tr_step5_title' | 'therapy.tr_step5_desc' | 'therapy.tr_step5_hint' | 'therapy.tr_step5_belief' | 'therapy.tr_step5_belief_min'
  | 'therapy.tr_step5_belief_max' | 'therapy.tr_step5_infobox'
  | 'therapy.tr_step6_title' | 'therapy.tr_step6_desc' | 'therapy.tr_step6_hint' | 'therapy.tr_step6_label' | 'therapy.tr_step6_ph'
  | 'therapy.tr_step6_followup' | 'therapy.tr_step6_followup_min' | 'therapy.tr_step6_followup_max' | 'therapy.tr_step6_infobox'
  | 'therapy.tr_emotion_anxiety' | 'therapy.tr_emotion_sadness' | 'therapy.tr_emotion_anger' | 'therapy.tr_emotion_fear'
  | 'therapy.tr_emotion_shame' | 'therapy.tr_emotion_guilt' | 'therapy.tr_emotion_loneliness' | 'therapy.tr_emotion_despair'
  | 'therapy.tr_emotion_irritation' | 'therapy.tr_emotion_confusion'
  | 'therapy.tr_dist_catastrophizing' | 'therapy.tr_dist_all_or_nothing' | 'therapy.tr_dist_overgeneralization'
  | 'therapy.tr_dist_mind_reading' | 'therapy.tr_dist_should' | 'therapy.tr_dist_emotional_reasoning'
  | 'therapy.tr_dist_selective_abstraction' | 'therapy.tr_dist_labeling' | 'therapy.tr_dist_disqualifying_positive'
  | 'therapy.tr_dist_magnification' | 'therapy.tr_dist_personalization' | 'therapy.tr_dist_blaming'
  | 'therapy.tr_dist_unfair_comparison' | 'therapy.tr_dist_regret' | 'therapy.tr_dist_pessimistic_prediction'
  | 'emotion.health_title' | 'emotion.health_index' | 'emotion.view_detail' | 'emotion.no_data' | 'emotion.no_data_hint'
  | 'emotion.recent_7d_count' | 'emotion.risk_low' | 'emotion.risk_medium_low' | 'emotion.risk_medium' | 'emotion.risk_high' | 'emotion.risk_critical'
  | 'risk.dashboard_title' | 'risk.dashboard_subtitle' | 'risk.composite_index' | 'risk.risk_level' | 'risk.level_suffix' | 'risk.days_suffix'
  | 'risk.baseline_compare' | 'risk.mood_score' | 'risk.task_rate' | 'risk.habit_rate' | 'risk.diary_freq' | 'risk.baseline_prefix'
  | 'risk.health_dim' | 'risk.health_index_label' | 'risk.risk_trend' | 'risk.risk_index_label' | 'risk.no_data' | 'risk.no_trend_data'
  | 'risk.signal_analysis' | 'risk.weight_suffix' | 'risk.weight_suffix_pct' | 'risk.risk_factors'
  | 'risk.signal_emotion' | 'risk.signal_behavior' | 'risk.signal_assessment' | 'risk.signal_chat' | 'risk.signal_diary'
  | 'risk.dim_emotion' | 'risk.dim_behavior' | 'risk.dim_assessment' | 'risk.dim_chat' | 'risk.dim_diary'
  | 'risk.early_warning' | 'risk.early_warning_subtitle' | 'risk.days_to_critical' | 'risk.no_warning' | 'risk.no_warning_desc'
  | 'risk.warning_green' | 'risk.warning_yellow' | 'risk.warning_orange' | 'risk.warning_red' | 'risk.anomaly_score' | 'risk.refresh' | 'risk.refreshing' | 'risk.partial_data'
  | 'risk.trend_title' | 'risk.risk_index' | 'risk.level_low' | 'risk.level_medium' | 'risk.level_high'
  | 'risk.status_high' | 'risk.status_attention' | 'risk.status_normal' | 'risk.status_good'
<<<<<<< HEAD
  | 'risk.timeline_summary_rising' | 'risk.timeline_summary_falling' | 'risk.timeline_summary_stable'
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  | 'risk.seek_help_title' | 'risk.hotline_label' | 'risk.partial_loading_hint'
  | 'appearance.title' | 'appearance.subtitle' | 'appearance.accent' | 'appearance.accent_desc' | 'appearance.font_scale' | 'appearance.font_scale_desc'
  | 'appearance.reduce_motion' | 'appearance.reduce_motion_desc'
  | 'appearance.preview' | 'appearance.font_small' | 'appearance.font_normal' | 'appearance.font_large' | 'appearance.font_xlarge'
  | 'appearance.color_teal' | 'appearance.color_purple' | 'appearance.color_blue' | 'appearance.color_pink' | 'appearance.color_orange' | 'appearance.color_slate'
<<<<<<< HEAD
  | 'about.zhiyou' | 'about.tagline' | 'about.intro' | 'about.version' | 'about.tech_stack' | 'about.ethics'
  | 'about.helpline' | 'about.helpline_desc' | 'about.not_medical' | 'about.credits' | 'about.credits_desc'
  | 'settings.auto_backup' | 'settings.auto_backup_desc' | 'settings.auto_backup_enable' | 'settings.backup_interval' | 'settings.last_backup' | 'settings.never' | 'settings.backup_now' | 'settings.backing_up'
  | 'settings.change_location' | 'settings.location_migrated' | 'settings.location_restart_hint' | 'settings.location_migrate_fail'
  | 'chat.history' | 'chat.no_history' | 'chat.no_title' | 'chat.input_hint' | 'chat.new_conversation'
  | 'chat.today' | 'chat.yesterday' | 'chat.earlier' | 'chat.delete_confirm'
  | 'header.ai_settings' | 'header.ai_assistant' | 'header.sidebar_show' | 'header.sidebar_expand' | 'header.sidebar_collapse'
  | 'diary.date_label'
  | 'lock.title' | 'lock.subtitle' | 'lock.placeholder' | 'lock.error' | 'lock.unlock'
  | 'error.title' | 'error.retry' | 'error.retry_failed'
  // AI 冲刺新增（T02/T04/T05）
  | 'chat.session_summary' | 'chat.session_topic' | 'chat.session_turns' | 'chat.emotion_label'
  | 'chat.emotion_negative' | 'chat.emotion_neutral' | 'chat.emotion_positive' | 'chat.emotion_crisis'
  | 'chat.session_empty' | 'chat.degraded_path'
  | 'diag.title' | 'diag.desc' | 'diag.network' | 'diag.online' | 'diag.offline'
  | 'diag.model' | 'diag.model_loaded' | 'diag.model_off' | 'diag.api_key' | 'diag.key_set' | 'diag.key_missing'
  | 'diag.degradation' | 'diag.degradation_cloud' | 'diag.degradation_template' | 'diag.app_version'
  | 'diag.demo_mode' | 'diag.demo_on' | 'diag.demo_off' | 'diag.refresh' | 'diag.refreshing' | 'diag.ready_template'
  // 主进程降级提示（P2-12）
  | 'diag.main_process' | 'diag.main_degraded' | 'main.degraded_toast'
  // 统一确认弹窗标题（P2-8）
  | 'common.confirm_title' | 'common.delete_confirm_title'
  // 危机提醒反馈（方案A 自进化闭环）
  | 'crisis.feedback_question' | 'crisis.feedback_accurate' | 'crisis.feedback_false_alarm' | 'crisis.feedback_thanks'
  | 'settings.demo_active' | 'settings.demo_banner' | 'settings.demo_inject' | 'settings.demo_inject_desc'
  | 'settings.demo_clear' | 'settings.demo_clear_confirm' | 'settings.demo_inject_confirm'
  | 'evidence.title' | 'evidence.total' | 'evidence.level' | 'evidence.contributions' | 'evidence.triggers'
  | 'evidence.actions' | 'evidence.escalation' | 'evidence.disclaimer' | 'evidence.method_ref' | 'evidence.view'
  | 'method.title' | 'method.view_full' | 'method.doc_ref' | 'method.disclaimer'
  | 'method.evidence_summary' | 'method.prediction_summary'
  | 'method.position_title' | 'method.position_body' | 'method.boundary_title' | 'method.boundary_body'
  | 'method.weight_title' | 'method.weight_body' | 'method.threshold_title' | 'method.threshold_body'
  | 'method.trend_title' | 'method.trend_body'
  | 'evidence.no_data' | 'evidence.status_elevated' | 'evidence.status_normal' | 'evidence.status_no_data'
  | 'evidence.action_diary' | 'evidence.action_breathing' | 'evidence.action_assessment' | 'evidence.action_hotline'
  | 'evidence.escalation_true' | 'evidence.escalation_false'
  | 'privacy.title' | 'privacy.desc' | 'privacy.local_only' | 'privacy.local_only_desc' | 'privacy.encryption'
  | 'privacy.encryption_desc' | 'privacy.storage_location' | 'privacy.storage_location_desc' | 'privacy.no_network'
  | 'privacy.no_network_desc' | 'privacy.api_key_secure' | 'privacy.api_key_secure_desc'
  | 'onboarding.skip' | 'onboarding.prev' | 'onboarding.next' | 'onboarding.start'
  | 'onboarding.step1_title' | 'onboarding.step1_desc' | 'onboarding.step1_tip'
  | 'onboarding.step2_title' | 'onboarding.step2_desc' | 'onboarding.step2_tip'
  | 'onboarding.step3_title' | 'onboarding.step3_desc' | 'onboarding.step3_tip'
  | 'onboarding.step4_title' | 'onboarding.step4_desc' | 'onboarding.step4_tip'
  | 'pred.title' | 'pred.risk_upgrade' | 'pred.trend' | 'pred.trend_rising' | 'pred.trend_stable' | 'pred.trend_falling'
  | 'pred.method' | 'pred.note' | 'pred.disclaimer' | 'pred.no_data' | 'pred.confidence'
  | 'pred.method_logistic' | 'pred.method_heuristic' | 'pred.loading'
  | 'pred.baseline_compare' | 'pred.baseline' | 'pred.current' | 'pred.forecast' | 'pred.y_axis'
  | 'nav.demo_mode' | 'nav.privacy' | 'nav.diagnostics'
  | 'emotion.title' | 'emotion.subtitle' | 'emotion.monitoring' | 'emotion.active_days' | 'emotion.active_days_desc'
  | 'emotion.index' | 'emotion.records' | 'emotion.high_risk' | 'emotion.trend' | 'emotion.days'
  | 'emotion.health_profile' | 'emotion.prediction' | 'emotion.insights' | 'emotion.suggestions'
  | 'emotion.write_first' | 'emotion.distribution'
  | 'crisis.hotline_unified_name' | 'crisis.hotline_unified_desc' | 'crisis.not_medical'
  | 'crisis.resource_title' | 'crisis.nearby_hospital' | 'crisis.nearby_hospital_desc' | 'crisis.disclaimer'
  | 'therapy.resource_title' | 'therapy.resource_desc' | 'therapy.hotlines' | 'therapy.nearby_hospital'
  | 'therapy.nearby_hospital_desc' | 'therapy.disclaimer'
  // AI 冲刺 v2 补充（T02/T03/T04）
  | 'chat.source_local' | 'chat.source_cloud'
  | 'settings.demo_data_clear_btn' | 'settings.demo_data_clear_confirm' | 'settings.demo_data_clear_success'
  | 'pred.stat_note' | 'pred.method_linear'
  | 'diag.ready_template_enhanced' | 'diag.enter_demo'
  | 'diag.model_ready' | 'diag.model_unavailable'
  | 'evidence.disclaimer_text'
  | 'evidence.reason_score_threshold' | 'evidence.reason_cssrs_acute' | 'evidence.reason_multi_channel_crisis'
  // 本地自进化（知己度 + 反馈触点）
  | 'selfevo.title' | 'selfevo.subtitle' | 'selfevo.score' | 'selfevo.score_desc'
  | 'selfevo.dim_sentiment' | 'selfevo.dim_risk' | 'selfevo.dim_intervention'
  | 'selfevo.timeline' | 'selfevo.timeline_empty' | 'selfevo.calibrated' | 'selfevo.sample_insufficient'
  | 'selfevo.confidence_source' | 'selfevo.confidence_source_desc' | 'selfevo.disclaimer'
  | 'selfevo.reset' | 'selfevo.reset_desc' | 'selfevo.reset_success'
  | 'selfevo.timeline_sentiment' | 'selfevo.timeline_risk' | 'selfevo.timeline_intervention'
  | 'selfevo.timeline_forecast' | 'selfevo.timeline_behavior' | 'selfevo.timeline_early_warning' | 'selfevo.timeline_other'
  | 'feedback.correct_title' | 'feedback.correct_negative' | 'feedback.correct_neutral'
  | 'feedback.correct_positive' | 'feedback.correct_crisis'
  | 'feedback.risk_over' | 'feedback.risk_just' | 'feedback.risk_under'
  | 'feedback.intervention_helpful' | 'feedback.intervention_neutral' | 'feedback.intervention_not_helpful'
  | 'feedback.thanks' | 'feedback.disabled_crisis'
  // 隐私政策页（庆园杯 P0-5）
  | 'nav.privacy_policy'
  | 'privacy_policy.title' | 'privacy_policy.updated' | 'privacy_policy.intro'
  | 'privacy_policy.s1_title' | 'privacy_policy.s1_body'
  | 'privacy_policy.s2_title' | 'privacy_policy.s2_body'
  | 'privacy_policy.s3_title' | 'privacy_policy.s3_body'
  | 'privacy_policy.s4_title' | 'privacy_policy.s4_body'
  | 'privacy_policy.s5_title' | 'privacy_policy.s5_body'
  | 'privacy_policy.s6_title' | 'privacy_policy.s6_body'
  | 'privacy_policy.s7_title' | 'privacy_policy.s7_body'
  | 'privacy_policy.s8_title' | 'privacy_policy.s8_body'
  | 'privacy_policy.s9_title' | 'privacy_policy.s9_body'
  | 'privacy_policy.s10_title' | 'privacy_policy.s10_body'
  // 危机安全计划（SPI 六步）
  | 'nav.safety_plan'
  | 'safety_plan.title' | 'safety_plan.desc'
  | 'safety_plan.load_fail' | 'safety_plan.save_fail'
  | 'safety_plan.not_created' | 'safety_plan.not_created_desc' | 'safety_plan.create_btn'
  | 'safety_plan.step1_title' | 'safety_plan.step1_ph' | 'safety_plan.step1_hint'
  | 'safety_plan.step2_title' | 'safety_plan.step2_ph' | 'safety_plan.step2_hint'
  | 'safety_plan.step3_title' | 'safety_plan.step3_ph' | 'safety_plan.step3_hint'
  | 'safety_plan.step4_title' | 'safety_plan.step4_ph' | 'safety_plan.step4_hint'
  | 'safety_plan.step5_title' | 'safety_plan.step5_ph' | 'safety_plan.step5_hint'
  | 'safety_plan.step6_title' | 'safety_plan.step6_ph' | 'safety_plan.step6_hint'
  | 'safety_plan.empty_field' | 'safety_plan.disclaimer'
  | 'safety_plan.crisis_title' | 'safety_plan.crisis_desc'
  | 'safety_plan.edit' | 'safety_plan.save' | 'safety_plan.cancel' | 'safety_plan.saved'
  | 'safety_plan.updated_at' | 'safety_plan.go_therapy'
  | 'safety_plan.open_from_crisis'
  // 心理报告导出 PDF
  | 'report.export_pdf' | 'report.export_pdf_success' | 'report.export_pdf_fail' | 'report.export_pdf_no_data'
  // 离线心理科普库
  | 'knowledge.desc' | 'knowledge.search_placeholder' | 'knowledge.all_categories'
  | 'knowledge.no_results' | 'knowledge.tips' | 'knowledge.hotline_note'
  | 'knowledge.disclaimer' | 'knowledge.open_safety_plan'
  | 'chat.suggest_knowledge' | 'chat.knowledge_hint';
=======
  | 'settings.auto_backup' | 'settings.auto_backup_desc' | 'settings.auto_backup_enable' | 'settings.backup_interval' | 'settings.last_backup' | 'settings.never' | 'settings.backup_now' | 'settings.backing_up'
  | 'chat.history' | 'chat.no_history' | 'chat.no_title' | 'chat.input_hint' | 'chat.new_conversation'
  | 'header.ai_settings' | 'header.ai_assistant' | 'header.sidebar_show' | 'header.sidebar_expand' | 'header.sidebar_collapse'
  | 'diary.date_label'
  | 'lock.title' | 'lock.subtitle' | 'lock.placeholder' | 'lock.error' | 'lock.unlock'
  | 'error.title' | 'error.retry' | 'error.retry_failed';
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

export type Translations = Record<Lang, Record<TranslationKey, string>>;

export const translations: Translations = {
  'zh-CN': {
    'app.title': '知己',

    'nav.dashboard': '仪表盘',
    'nav.risk': '风险评估',
    'nav.tasks': '任务管理',
    'nav.diary': '日记',
    'nav.habits': '习惯',
    'nav.memories': '记忆',
    'nav.emotion': '情绪分析',
    'nav.therapy': '治疗练习',
    'nav.reports': '复盘总结',
    'nav.settings': '设置',
<<<<<<< HEAD
    'nav.about': '关于',
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'nav.data_local': '所有数据本地存储',
    'nav.group_daily': '日常',
    'nav.group_analysis': '分析',
    'nav.group_tools': '工具',
    'nav.group_system': '系统',
<<<<<<< HEAD
    'nav.assistant': '知己助理',
=======
    'nav.assistant': 'AI助理',
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'nav.assessment': '心理评估',

    'nav.sync': '手机同步',
    'nav.knowledge': '知识库',
    'nav.resources': '资源库',

    'sync.title': '手机同步',
    'sync.description': '扫码连接手机，同步数据到电脑',
    'sync.scan_to_connect': '请使用知己 Android App 扫码连接',
    'sync.server_status_running': '服务运行中',
    'sync.server_status_stopped': '服务未启动',
    'sync.start_server': '启动服务',
    'sync.stop_server': '停止服务',
    'sync.network_info': '网络信息',
    'sync.ip_address': 'IP 地址',
    'sync.port': '端口',
    'sync.no_synced_items': '暂无同步记录',
    'sync.received_items': '已接收 {count} 条数据',

    'assistant.title': 'AI个人助理',
    'assistant.placeholder': '输入消息...',
    'assistant.send': '发送',
    'assistant.loading': '思考中...',
    'assistant.welcome_title': '你好，我是知己AI',
    'assistant.welcome_desc': '我可以帮你分析计划、总结近况、提供建议',
    'assistant.error': '发生错误，请稍后再试',
    'assistant.suggest_analyze': '分析我的计划',
    'assistant.suggest_status': '看看我的状态',
    'assistant.suggest_help': '你能做什么',
    'assistant.clear': '清除对话',
    'chat.offline_mode': '离线陪伴模式',
    'chat.cloud_mode': '云对话已连接',
<<<<<<< HEAD
    'chat.source_local': '本地',
    'chat.source_cloud': '云端',
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'chat.welcome': '和知己聊聊吧，我在听。',
    'chat.input_placeholder': '说点什么…',
    'chat.disclaimer': '知己是陪伴助手，不能替代专业医疗。如有危机请拨打 400-161-9995。',
    'chat.suggest_diary': '写日记',
    'chat.suggest_breathing': '做呼吸',
    'chat.suggest_assessment': '做量表',
    'chat.settings_title': 'AI 对话设置',
    'chat.settings_desc': '配置后启用云对话，未配置时使用离线陪伴模式，数据仅存本地。',
    'chat.provider': '服务商',
    'chat.api_key': 'API Key',
    'chat.api_key_placeholder': '粘贴 API Key（加密存储）',
    'chat.test_connection': '测试连接',
    'chat.testing': '测试中…',
    'chat.test_success': '连接成功，延迟 {latency}ms，模型 {model}',
    'chat.test_fail': '连接失败：{error}',
    'chat.no_key': '未配置',
    'chat.save_key': '保存',
<<<<<<< HEAD
    'chat.model_name': '模型名称',
    'chat.save_model': '保存模型',
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

    'header.quick_capture': 'Ctrl+K 快速记录',

    'quick_capture.title': '快速记录',
    'quick_capture.placeholder': '写下你的想法...',
    'quick_capture.save': '保存',
    'quick_capture.cancel': '取消',
    'quick_capture.todo': '待办',
    'quick_capture.diary': '日记',
    'quick_capture.idea': '灵感',
    'quick_capture.memory': '记忆',
    'quick_capture.uncategorized': '未分类',
    'quick_capture.auto_classify': '支持自然语言自动分类',
    'quick_capture.saved_as': '已记录到',
    'quick_capture.hint': '⌘+Enter 快速保存',

    'welcome.title': '欢迎使用知己',
    'welcome.subtitle': '全功能个人管理系统',
    'welcome.select_lang': '选择你的语言',
    'welcome.start': '开始使用',
    'welcome.zh_desc': '中文界面，适合中文用户',
    'welcome.en_desc': 'English interface',

    'task.title': '任务管理',
    'task.input_placeholder': '添加新任务，回车快速创建',
    'task.all': '全部',
    'task.pending': '待办',
    'task.completed': '已完成',
    'task.overdue': '已过期',
    'task.urgent': '紧急',
    'task.high': '高',
    'task.medium': '中',
    'task.low': '低',
    'task.rolled_over': '已自动顺延',
    'task.from': '从',
    'task.expired': '已过期',
    'task.detail': '任务详情',
    'task.delete': '删除',
    'task.save': '保存',
    'task.cancel': '取消',
    'task.title_label': '标题',
    'task.description_label': '描述',
    'task.priority_label': '优先级',
    'task.scheduled_date_label': '计划日期',
    'task.tags_label': '标签',
    'task.status_filter': '状态',
    'task.priority_filter': '优先级',
    'task.rollover_notice': '此任务从 {date} 自动顺延',
    'task.more': '还有 {count} 项...',
    'task.rollover_banner': '已自动顺延 {count} 项未完成任务到今天',
    'task.new_task': '新建任务',
    'task.create': '创建',
    'task.repeat_toggle': '重复任务',
    'task.repeat_interval': '持续天数',
    'task.repeat_end': '开始日期',
    'task.no_tasks': '没有任务',
    'task.no_tasks_desc': '添加一个新任务开始吧',
    'task.loading': '加载任务中...',
    'task.today': '今天',
    'task.yesterday': '昨天',
    'task.tomorrow': '明天',
    'task.stats.all': '全部任务',
    'task.stats.today': '今日任务',
    'task.stats.pending': '待完成',
    'task.stats.completed': '已完成',
    'task.stats.rollover': '自动延续',
    'task.rolled_to_tomorrow': '已延续至明日',
    'task.title_required': '标题不能为空',
    'task.pending_rollover': '待顺延',
    'diary.title': '日记',
    'diary.write': '写日记',
    'diary.no_entries': '还没有日记',
    'diary.no_entries_desc': '记录你的第一天吧',
    'diary.write_first': '写第一篇日记',
    'diary.title_placeholder': '标题（可选）',
    'diary.content_placeholder': '写下今天的感受、经历、思考...',
    'diary.weather': '天气',
<<<<<<< HEAD
    'diary.tags': '标签',
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'diary.save': '保存',
    'diary.update': '更新',
    'diary.save_emotion_fail': '情感记录保存失败，但日记已保存',
    'diary.cancel': '取消',
    'diary.back': '返回日记列表',
    'diary.weather_placeholder': '天气 ☀️',
    'diary.tags_placeholder': '添加标签',
    'diary.loading': '加载日记中...',

    'habit.title': '习惯追踪',
    'habit.create': '新建习惯',
    'habit.no_habits': '还没有习惯',
    'habit.no_habits_desc': '创建一个好习惯开始追踪吧',
    'habit.name': '习惯名称',
    'habit.name_placeholder': '如：每天阅读30分钟',
    'habit.desc': '描述（可选）',
    'habit.color': '颜色',
    'habit.create_btn': '创建',
    'habit.cancel': '取消',
    'habit.log': '打卡',
    'habit.logged': '已打卡',
    'habit.streak_days': '天连续',
    'habit.daily': '每日',
    'habit.times': '次',
    'habit.loading': '加载习惯中...',

    'memory.title': '记忆沉淀',
<<<<<<< HEAD
    'memory.description': '自动收录你在对话、日记和任务中的关键信息，帮你快速回顾重要内容',
    'memory.go_diary': '去写一篇日记',
    'memory.go_chat': '去和知己聊聊',
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'memory.create': '新建记忆',
    'memory.edit': '编辑记忆',
    'memory.no_memories': '没有记忆',
    'memory.no_memories_desc': '开始记录你的想法和知识吧',
    'memory.search_placeholder': '搜索记忆标题、内容、标签...',
    'memory.all_categories': '分类',
    'memory.title_placeholder': '给你的记忆起个名字',
    'memory.content_placeholder': '记录你的知识、想法、感悟...',
    'memory.type': '类型',
    'memory.source': '来源（可选）',
    'memory.category': '分类',
    'memory.tags': '标签',
    'memory.save': '保存',
    'memory.update': '更新',
    'memory.cancel': '取消',
    'memory.manual': '手动',
    'memory.idea': '灵感',
    'memory.insight': '洞察',
    'memory.diary_extract': '日记',
    'memory.bookmark': '书签',
    'memory.other': '其他',
    'memory.title_label': '标题',
    'memory.content_label': '内容',
    'memory.type_label': '类型',
    'memory.category_label': '分类',
    'memory.category_header': '分类',
    'memory.source_label': '来源（可选）',
    'memory.source_placeholder': '如：读书笔记、项目经验',
    'memory.tags_label': '标签',
    'memory.default_category': '默认',
    'memory.loading': '加载记忆中...',
    'memory.all': '全部',
    'memory.all_memories': '全部记忆',
    'memory.candidates': '待提取',
    'memory.candidates_empty': '暂无待提取内容',
    'memory.candidates_empty_desc': '继续写日记和完成任务，系统会自动提取候选记忆',
    'memory.candidates_select_all': '全选',
    'memory.candidates_confirm': '确认为记忆 ({n})',
    'memory.candidates_reject': '忽略 ({n})',
    'memory.candidates_source_diary': '来源：日记',
    'memory.candidates_source_task': '来源：任务',
    'memory.candidates_source_capture': '来源：快速记录',
    'memory.candidates_scan': '扫描提取',
    'memory.candidates_found': '发现 {count} 条候选记忆',
    'memory.candidates_none': '没有发现新的候选记忆',
    'memory.candidates_error': '扫描失败',
    'memory.candidates_ai_toggle': 'AI 智能提取',
    'memory.candidates_ai_scan': 'AI 提取中...',

    'report.title': '复盘报告',
    'report.daily': '日报',
    'report.weekly': '周报',
    'report.monthly': '月报',
    'report.task_rate': '任务完成率',
    'report.tasks_done': '完成任务',
    'report.diary_days': '日记天数',
    'report.mood_avg': '平均心情',
    'report.habit_rate': '习惯完成率',
    'report.word_count': '总字数',
    'report.task_chart': '任务完成情况',
    'report.mood_chart': '心情变化',
    'report.habit_chart': '习惯完成率',
    'report.total': '总任务',
    'report.completed': '已完成',
    'report.loading': '生成报告中...',
    'report.select_hint': '选择一个报告类型开始分析',
<<<<<<< HEAD
    'report.ai_report': '心理分析报告',
=======
    'report.ai_report': 'AI 分析报告',
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'report.insights': '洞察',
    'report.suggestions': '建议',
    'report.health_radar': '心理健康画像',
    'report.emotion_trend': '情绪趋势',
    'report.no_emotion_data': '暂无情绪数据',
<<<<<<< HEAD
    'report.view_emotion_page': '查看情绪分析',
    'report.no_data': '暂无数据',
    'report.today': '今日',
    'report.latest_habit_day': '最近打卡日',
=======
    'report.no_data': '暂无数据',
    'report.today': '今日',
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'report.avg_rate': '平均完成率',
    'report.trend': '趋势',

    'settings.title': '设置',
    'settings.data_mgmt': '数据管理',
    'settings.data_desc': '所有数据存储在浏览器本地，建议定期导出备份',
    'settings.export': '导出数据',
    'settings.import': '导入数据',
    'settings.storage_info': '存储信息',
    'settings.storage_desc': '数据存储在浏览器 IndexedDB 中',
    'settings.about': '关于知己',
<<<<<<< HEAD
    'about.zhiyou': '知己（Zhiyou）',
    'about.tagline': '本地优先 · 隐私优先 · 心理健康陪伴助手',
    'about.intro': '知己是一个本地优先的桌面心理健康应用：多信号可解释风险评估 + 统计早期预警 + ML 情感/危机识别。所有数据只保存在你的设备上，不上传任何服务器。',
    'about.version': '版本',
    'about.tech_stack': 'Electron + React + 本地模型',
    'about.ethics': '伦理声明：本应用提供陪伴与早期风险提示，不替代专业医疗诊断与治疗。如有需要，请及时寻求专业帮助。',
    'about.helpline': '心理援助热线',
    'about.helpline_desc': '如果你或身边的人正经历心理困扰，请拨打以下热线：',
    'about.not_medical': '我不能替代专业医疗。紧急情况请立即拨打 120 或前往就近医院。',
    'about.credits': '致谢',
    'about.credits_desc': '感谢开源社区与心理学研究者的工作。本项目为广州大学"庆园杯"人工智能创新应用大赛参赛作品。',
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'settings.about_desc': '个人管理系统 v1.0，所有数据本地存放，不上传任何服务器',
    'settings.model_status': '情感分析模型状态',
    'settings.model_status_desc': '关键词分析随时可用。训练 ONNX 模型可提升分析精度。',
    'settings.demo_data': '演示数据',
    'settings.demo_data_desc': '填充预设数据，方便演示和答辩展示。',
    'settings.demo_data_btn': '填充演示数据',
    'settings.demo_data_confirm': '填充演示数据将清除当前所有数据，确定继续？',
    'settings.demo_data_success': '演示数据填充成功！',
    'settings.demo_data_fail': '演示数据填充失败',
    'settings.open_folder': '打开存储文件夹',
<<<<<<< HEAD
    'settings.change_location': '更改存储位置',
    'settings.location_migrated': '数据已迁移到新位置',
    'settings.location_restart_hint': '需要重启应用以切换到新存储位置，现在重启吗？',
    'settings.location_migrate_fail': '迁移失败，请重试',
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'settings.reset': '恢复初始化',
    'settings.reset_confirm': '确定要恢复初始化吗？所有数据将被清除，此操作不可恢复。',
    'settings.theme': '主题外观',
    'settings.theme_system': '跟随系统',
    'settings.theme_light': '浅色',
    'settings.theme_dark': '深色',
    'settings.shortcuts': '快捷键',
    'settings.shortcuts_desc': '自定义键盘快捷键，点击快捷键即可修改',
    'settings.shortcuts_quick_capture': '快速记录',
    'settings.shortcuts_export': '导出数据',
    'settings.shortcuts_import': '导入数据',
    'settings.shortcuts_press_keys': '按下快捷键...',
    'settings.shortcuts_conflict': '此快捷键与系统快捷键「{name}」冲突，确定使用？',
    'settings.shortcuts_confirm': '确认使用',
    'settings.shortcuts_reset': '重置全部',
    'settings.ai': 'AI设置',
    'settings.ai_desc': '配置AI助手的行为与模型',
    'settings.ai_tone': '回复语气',
    'settings.ai_tone_professional': '专业',
    'settings.ai_tone_friendly': '友好',
    'settings.ai_tone_concise': '简洁',
    'settings.ai_tone_encouraging': '鼓励',
    'settings.ai_tone_counselor': '心理咨询师',
    'settings.ai_mode_online': '在线模式',
    'settings.ai_mode_offline': '离线模式',
    'settings.ai_offline_tip': '离线模式：使用本地模型，无需网络，保护隐私。首次加载约需 3-5 秒。',
    'settings.ai_provider': 'AI模型',
    'settings.ai_api_key': 'API密钥',
    'settings.ai_api_key_placeholder': '输入API密钥（暂存本地）',
    'settings.ai_model': '模型',
    'notification.title': '通知提醒',
    'notification.test': '测试通知',
    'notification.add': '添加',
    'notification.cancel': '取消',
    'notification.diary': '日记提醒',
    'notification.habit': '习惯提醒',
    'notification.custom': '自定义',
    'notification.title_placeholder': '提醒标题',
    'notification.body_placeholder': '提醒内容（可选）',
    'notification.empty': '暂无提醒',
    'notification.desc': '提醒会在设定时间通过系统通知发送。请确保系统通知权限已开启。',
    'settings.online_model_title': '配置在线模型',
    'settings.online_model_desc': '选择在线模型服务商并输入 API Key',
    'settings.online_provider': '模型服务商',
    'settings.online_model_hint': 'API Key 仅存储在本地，不会同步到其他设备',

    'mode_selection.title': '选择 AI 运行模式',
    'mode_selection.online': '在线模式',
    'mode_selection.online_desc': '使用 DeepSeek API 服务，需要网络连接',
    'mode_selection.offline': '离线模式',
    'mode_selection.offline_desc': '使用本地模型，无需网络，保护隐私',
    'mode_selection.hint': '在线模式需要配置 API Key，离线模式使用本地 Qwen3-0.6B 模型',

    'model_download.title': '选择本地模型',
    'model_download.select': '请选择要使用的本地 AI 模型（模型文件位于应用数据目录的 models 子目录）',
    'model_download.loading': '加载中...',
    'model_download.use_model': '使用此模型',
    'model_download.selected': '已选择',
    'model_download.path': '模型文件位置（见上方列表中各模型的实际路径）',
    'model_download.cancel': '取消',

    'dashboard.welcome': '欢迎回来',
    'dashboard.today_overview': '今日概览',
    'dashboard.today_todos': '今日待办',
    'dashboard.no_todos': '今天没有待办事项 🎉',
    'dashboard.habit_summary': '习惯追踪',
    'dashboard.no_habits': '还没有习惯',
    'dashboard.completed': '已完成',
    'dashboard.mood_trend': '心情趋势',
    'dashboard.recent_diary': '最近日记',
    'dashboard.view_all': '查看全部',
    'dashboard.task_progress': '任务完成',
    'dashboard.habit_progress': '习惯打卡',
    'dashboard.stats_today_task': '今日任务',
    'dashboard.stats_week_task': '本周任务',
    'dashboard.stats_week_diary': '本周日记',
    'dashboard.stats_habits': '习惯数',
    'dashboard.today_diary': '今日日记',
    'dashboard.no_diary_today': '今天还没有写日记',
    'dashboard.write_diary': '写日记',
    'dashboard.diary_preview': '内容预览',
    'dashboard.habit_checkin': '习惯打卡',
    'dashboard.study_checkin': '学习打卡',
    'dashboard.week_goal': '本周目标',
    'dashboard.weekly_review_entries': '复盘总结',
    'dashboard.daily_quote': '每日一句',
    'dashboard.edit_quote': '编辑',
    'dashboard.add_quote': '添加语录',
    'dashboard.delete_quote': '删除',
    'dashboard.quote_author': '作者',
    'dashboard.quote_placeholder': '写下今天想送给自己的一句话...',

    'common.confirm': '确认',
    'common.cancel': '取消',
    'common.delete': '删除',
    'common.save': '保存',
    'common.edit': '编辑',
    'common.search': '搜索',
    'common.loading': '加载中...',
    'common.backup_success': '数据导出成功',
    'common.backup_fail': '导出失败',
    'common.import_success': '数据导入成功',
    'common.import_fail': '导入失败，请检查文件格式',
    'common.save_fail': '保存失败',
    'common.delete_fail': '删除失败',
    'common.copy_fail': '复制失败',
    'common.empty_title': '暂无数据',
    'common.empty_desc': '还没有内容，快去创建一条吧',
    'common.clickable_card': '可点击卡片',
    'common.tag_input': '标签输入',
    'common.add_tag': '添加标签',
    'common.remove_tag': '移除标签 {name}',
    'common.tag_placeholder': '输入标签后回车',
    'common.search_placeholder': '搜索...',
    'common.feedback_thanks': '感谢反馈',
    'common.feedback_accurate': '准确',
    'common.feedback_inaccurate': '不准',
    'common.feedback_ask': '分析准确吗？',
    'common.loading_label': '加载中',
    'quick_capture.type_label': '分类:',
    'mood.1': '很差',
    'mood.2': '不好',
    'mood.3': '一般',
    'mood.4': '不错',
    'mood.5': '很棒',
    'common.delete_confirm': '确定要删除吗？此操作不可恢复。',
    'common.hint': '💡 支持自然语言自动分类',
    'common.load_more': '加载更多',

    // Crisis intervention
    'crisis.title': '我们关心你',
    'crisis.subtitle': '你并不孤单，有人愿意帮助你',
    'crisis.description_1': '我们注意到你可能正在经历一些困难时期。请记住，',
    'crisis.description_2': '寻求帮助是勇敢的表现',
    'crisis.description_3': '，你值得被关心和支持。',
    'crisis.description_4': '如果你正在经历危机，请拨打以下热线，专业的心理咨询师会为你提供帮助。',
    'crisis.hotline_title': '心理援助热线',
    'crisis.online_counseling': '在线咨询：',
    'crisis.close_button': '我已了解，关闭',
    'crisis.countdown': '{seconds} 秒后可关闭',
    'crisis.aria_label': '危机干预',
<<<<<<< HEAD
    'crisis.feedback_question': '这次提醒准确吗？',
    'crisis.feedback_accurate': '准确',
    'crisis.feedback_false_alarm': '误报',
    'crisis.feedback_thanks': '已记住，以后类似的表达会更克制',
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'crisis.hotline_national_name': '全国心理援助热线',
    'crisis.hotline_national_desc': '24小时免费心理危机干预热线',
    'crisis.hotline_beijing_name': '北京心理危机研究与干预中心',
    'crisis.hotline_beijing_desc': '24小时心理危机干预热线',
    'crisis.hotline_life_name': '生命热线',
    'crisis.hotline_life_desc': '专业心理危机干预',
    'crisis.hotline_hope_name': '希望24热线',
    'crisis.hotline_hope_desc': '24小时青少年心理援助',
    'crisis.online_link_cas_label': '中科院心理所',
    'crisis.online_link_bj_label': '北京心理危机干预中心',

    // CBT Thought Record
    'therapy.tr_title': 'CBT 思维记录',
    'therapy.tr_subtitle': '识别和挑战不合理的自动思维',
    'therapy.tr_step_prev': '上一步',
    'therapy.tr_step_next': '下一步',
    'therapy.tr_step_save': '保存记录',
    'therapy.tr_step_saving': '保存中...',
    'therapy.tr_saved_title': '保存成功！',
    'therapy.tr_saved_subtitle': '记录已保存',
    'therapy.tr_saved_desc': '情绪强度从 {before}% 变为 {after}%',
    'therapy.tr_saved_decreased': '，降低了 {diff}%',
    'therapy.tr_write_another': '再写一篇',
    'therapy.tr_back': '返回',
    'therapy.tr_step0_title': '情境',
    'therapy.tr_step0_desc': '发生了什么？',
    'therapy.tr_step0_hint': '描述一个让你感到困扰的具体情境。尽量客观地描述事实，而不是你的想法。',
    'therapy.tr_step0_label': '情境描述',
    'therapy.tr_step0_ph': '例如：今天开会时，领导批评了我的方案...',
    'therapy.tr_step1_title': '自动思维',
    'therapy.tr_step1_desc': '脑海中浮现了什么想法？',
    'therapy.tr_step1_hint': '当时你脑海中自动浮现了什么想法？这些想法往往是瞬间的、自动的。',
    'therapy.tr_step1_label': '自动思维',
    'therapy.tr_step1_ph': '例如：我真是太没用了，什么都做不好...',
    'therapy.tr_step1_distortion_hint': '可能存在思维扭曲：',
    'therapy.tr_step2_title': '情绪',
    'therapy.tr_step2_desc': '感受如何？',
    'therapy.tr_step2_hint': '选择你当时感受到的情绪（可多选），并调节情绪强度。',
    'therapy.tr_step2_intensity': '情绪强度',
    'therapy.tr_step2_intensity_label': '情绪强度',
    'therapy.tr_step2_intensity_min': '轻微',
    'therapy.tr_step2_intensity_max': '强烈',
    'therapy.tr_step3_title': '证据评估',
    'therapy.tr_step3_desc': '支持和反对这个想法的证据',
    'therapy.tr_step3_hint': '客观地分析：有哪些证据支持这个想法？有哪些证据反对它？',
    'therapy.tr_step3_for_label': '支持的证据',
    'therapy.tr_step3_for_ph': '有哪些事实支持这个想法？',
    'therapy.tr_step3_against_label': '反对的证据',
    'therapy.tr_step3_against_ph': '有哪些事实不支持这个想法？',
    'therapy.tr_step4_title': '替代想法',
    'therapy.tr_step4_desc': '更平衡的看法是什么？',
    'therapy.tr_step4_hint': '基于以上分析，一个更平衡、更客观的看法是什么？',
    'therapy.tr_step4_label': '替代想法',
    'therapy.tr_step4_ph': '例如：虽然这次方案被批评了，但这不代表我能力不行，我可以从中学习改进...',
    'therapy.tr_step4_new_intensity': '现在的情绪强度',
    'therapy.tr_step4_decreased_to': '情绪强度从 {before}% 降低到 {after}%，降低了 {diff}%！',
    'therapy.tr_step5_title': '信念度评估',
    'therapy.tr_step5_desc': '你对替代想法的相信程度',
    'therapy.tr_step5_hint': '你对这个替代想法的相信程度有多少？（0-100%）',
    'therapy.tr_step5_belief': '信念度',
    'therapy.tr_step5_belief_min': '完全不信',
    'therapy.tr_step5_belief_max': '完全相信',
    'therapy.tr_step5_infobox': '信念度可以帮助你追踪对替代想法的接受程度。随着时间推移，这个数字可能会上升。',
    'therapy.tr_step6_title': '行动计划',
    'therapy.tr_step6_desc': '如何验证新的想法？',
    'therapy.tr_step6_hint': '你可以做些什么来验证这个新的想法？制定一个具体的行为实验计划。',
    'therapy.tr_step6_label': '行为实验计划',
    'therapy.tr_step6_ph': '例如：下次方案被批评时，我会主动询问具体改进点，而不是直接否定自己...',
    'therapy.tr_step6_followup': '后续情绪评分（可稍后填写）',
    'therapy.tr_step6_followup_min': '轻微',
    'therapy.tr_step6_followup_max': '强烈',
    'therapy.tr_step6_infobox': '行为实验是CBT的重要组成部分。通过实际行动来检验你的想法，可以帮助你建立更健康的思维模式。',
    'therapy.tr_emotion_anxiety': '焦虑',
    'therapy.tr_emotion_sadness': '悲伤',
    'therapy.tr_emotion_anger': '愤怒',
    'therapy.tr_emotion_fear': '恐惧',
    'therapy.tr_emotion_shame': '羞耻',
    'therapy.tr_emotion_guilt': '内疚',
    'therapy.tr_emotion_loneliness': '孤独',
    'therapy.tr_emotion_despair': '绝望',
    'therapy.tr_emotion_irritation': '烦躁',
    'therapy.tr_emotion_confusion': '困惑',
    'therapy.tr_dist_catastrophizing': '灾难化：把事情想到最坏',
    'therapy.tr_dist_all_or_nothing': '非黑即白：只有好和坏两个极端',
    'therapy.tr_dist_overgeneralization': '过度概括：一次失败就觉得永远失败',
    'therapy.tr_dist_mind_reading': '读心术：假设别人怎么想',
    'therapy.tr_dist_should': '应该思维：我应该/必须...',
    'therapy.tr_dist_emotional_reasoning': '情绪推理：我觉得...所以是真的',
    'therapy.tr_dist_selective_abstraction': '选择性关注：只看负面',
    'therapy.tr_dist_labeling': '贴标签：我是个失败者',
    'therapy.tr_dist_disqualifying_positive': '否定正面：把好事解释成例外',
    'therapy.tr_dist_magnification': '放大缩小：放大缺点，缩小优点',
    'therapy.tr_dist_personalization': '个人化：都是我的错',
    'therapy.tr_dist_blaming': '指责：都是别人的错',
    'therapy.tr_dist_unfair_comparison': '不公平比较：拿自己的弱点比别人的优点',
    'therapy.tr_dist_regret': '后悔倾向：要是...就好了',
    'therapy.tr_dist_pessimistic_prediction': '悲观预测：未来一定会更糟',

    // Emotion overview
    'emotion.health_title': '情绪健康',
    'emotion.health_index': '情绪指数',
    'emotion.view_detail': '查看详情',
    'emotion.no_data': '暂无数据',
    'emotion.no_data_hint': '写日记后自动分析',
    'emotion.recent_7d_count': '近7天分析 {count} 条',
    'emotion.risk_low': '良好',
    'emotion.risk_medium_low': '偏低',
    'emotion.risk_medium': '中等',
    'emotion.risk_high': '偏高',
    'emotion.risk_critical': '危险',

    // Risk dashboard
    'risk.dashboard_title': '心理守护概览',
    'risk.dashboard_subtitle': '综合多维度数据分析，温柔守护心理健康',
    'risk.composite_index': '综合风险指数',
    'risk.risk_level': '风险等级',
    'risk.level_suffix': '风险',
    'risk.days_suffix': '天',
    'risk.baseline_compare': '与个人基线对比',
    'risk.mood_score': '心情评分',
    'risk.task_rate': '任务完成率',
    'risk.habit_rate': '习惯完成率',
    'risk.diary_freq': '日记频率',
    'risk.baseline_prefix': '基线',
    'risk.health_dim': '健康维度分析',
    'risk.health_index_label': '健康指数',
    'risk.risk_trend': '风险趋势',
    'risk.risk_index_label': '风险指数',
    'risk.no_data': '暂无数据',
    'risk.no_trend_data': '暂无趋势数据',
    'risk.signal_analysis': '信号源分析',
    'risk.weight_suffix': '权重 {weight}',
    'risk.weight_suffix_pct': '权重 {weight}%',
    'risk.risk_factors': '风险因素',
    'risk.signal_emotion': '情绪分析',
    'risk.signal_behavior': '行为模式',
    'risk.signal_assessment': '评估量表',
    'risk.signal_chat': 'AI聊天',
    'risk.signal_diary': '日记情绪',
    'risk.dim_emotion': '情绪',
    'risk.dim_behavior': '行为',
    'risk.dim_assessment': '评估',
    'risk.dim_chat': '聊天',
    'risk.dim_diary': '日记',
    'risk.early_warning': '早期预警',
    'risk.early_warning_subtitle': '基于近 15 天滑动窗口趋势，提前识别风险恶化',
    'risk.days_to_critical': '距临界点约',
    'risk.no_warning': '当前状态良好',
    'risk.no_warning_desc': '近 15 天趋势平稳，未检测到风险恶化信号',
    'risk.warning_green': '安全',
    'risk.warning_yellow': '轻度预警',
    'risk.warning_orange': '中度预警',
    'risk.warning_red': '高度预警',
    'risk.anomaly_score': '异常分数',
    'risk.refresh': '刷新',
    'risk.refreshing': '分析中',
    'risk.partial_data': '数据不足，仅显示部分信号',
    'risk.trend_title': '风险趋势',
    'risk.risk_index': '风险指数',
    'risk.level_low': '低风险',
    'risk.level_medium': '中风险',
    'risk.level_high': '高风险',
    'risk.status_high': '高风险',
    'risk.status_attention': '需关注',
    'risk.status_normal': '正常',
    'risk.status_good': '良好',
    'risk.seek_help_title': '建议立即寻求专业帮助',
    'risk.hotline_label': '24 小时心理援助热线',
<<<<<<< HEAD
    'risk.timeline_summary_rising': '最近风险分数呈上升趋势（当前 {level}，最新 {latest} 分），建议关注并坚持记录',
    'risk.timeline_summary_falling': '最近风险分数呈下降趋势（当前 {level}，最新 {latest} 分），状态在好转',
    'risk.timeline_summary_stable': '最近风险分数整体平稳（当前 {level}，最新 {latest} 分），未见明显波动',
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'risk.partial_loading_hint': '部分信号源加载中，以下为已可用数据。可点击下方重试获取完整分析。',
    'appearance.title': '外观',
    'appearance.subtitle': '个性化你的视觉体验',
    'appearance.accent': '强调色',
    'appearance.accent_desc': '影响按钮、链接、强调元素的色调',
    'appearance.font_scale': '字号缩放',
    'appearance.font_scale_desc': '调整全局文字大小',
    'appearance.reduce_motion': '减少动效',
    'appearance.reduce_motion_desc': '适用于对动效敏感的用户',
    'appearance.preview': '预览',
    'appearance.font_small': '小',
    'appearance.font_normal': '默认',
    'appearance.font_large': '大',
    'appearance.font_xlarge': '超大',
    'appearance.color_teal': '青绿',
    'appearance.color_purple': '紫色',
    'appearance.color_blue': '蓝色',
    'appearance.color_pink': '粉色',
    'appearance.color_orange': '橙色',
    'appearance.color_slate': '灰蓝',

    // Settings auto-backup
    'settings.auto_backup': '自动备份提醒',
    'settings.auto_backup_desc': '定期提醒备份数据，防止意外丢失',
    'settings.auto_backup_enable': '启用备份提醒',
    'settings.backup_interval': '提醒间隔',
    'settings.last_backup': '上次备份：',
    'settings.never': '从未',
    'settings.backup_now': '立即备份',
    'settings.backing_up': '备份中...',

    // Chat
    'chat.history': '历史对话',
    'chat.no_history': '暂无历史对话',
    'chat.no_title': '(无标题)',
    'chat.input_hint': 'Enter 发送 · Shift+Enter 换行',
    'chat.new_conversation': '新对话',
<<<<<<< HEAD
    'chat.today': '今天',
    'chat.yesterday': '昨天',
    'chat.earlier': '更早',
    'chat.delete_confirm': '确定删除这个对话吗？删除后不可恢复。',

    // Header
    'header.ai_settings': 'AI 设置',
    'header.ai_assistant': '知己助理',
=======

    // Header
    'header.ai_settings': 'AI 设置',
    'header.ai_assistant': 'AI 助理',
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'header.sidebar_show': '显示侧边栏',
    'header.sidebar_expand': '展开侧边栏',
    'header.sidebar_collapse': '折叠侧边栏',

    // Diary
    'diary.date_label': '日期',

    // Lock screen
    'lock.title': '应用已锁定',
    'lock.subtitle': '请输入密码解锁',
    'lock.placeholder': '输入密码',
    'lock.error': '密码错误',
    'lock.unlock': '解锁',

    // Error boundary
    'error.title': '出错了',
    'error.retry': '重试',
    'error.retry_failed': '多次重试失败，请刷新页面或重启应用',
<<<<<<< HEAD

    // ── AI 冲刺新增（T02/T04/T05）────────────────────────────
    // Chat 会话
    'chat.session_summary': '会话摘要',
    'chat.session_topic': '主题',
    'chat.session_turns': '已对话 {count} 轮',
    'chat.emotion_label': '情绪',
    'chat.emotion_negative': '低落',
    'chat.emotion_neutral': '平稳',
    'chat.emotion_positive': '积极',
    'chat.emotion_crisis': '危机',
    'chat.session_empty': '开始对话后，这里会显示当前情绪与话题摘要',
    'chat.degraded_path': '离线模板对话已就绪（无 Key / 断网时自动使用）',

    // 系统自检
    'diag.title': '系统自检',
    'diag.desc': '检查联网、情感模型、API Key 与对话降级路径',
    'diag.network': '网络连接',
    'diag.online': '已联网',
    'diag.offline': '离线',
    'diag.model': '情感模型（ONNX）',
    'diag.model_loaded': '已加载',
    'diag.model_ready': '可用-待加载',
    'diag.model_unavailable': '不可用',
    'diag.model_off': '未加载（降级关键词）',
    'diag.api_key': 'API Key',
    'diag.key_set': '已配置',
    'diag.key_missing': '未配置',
    'diag.degradation': '对话降级路径',
    'diag.degradation_cloud': '云对话',
    'diag.degradation_template': '离线模板对话',
    'diag.app_version': '版本',
    'diag.demo_mode': '演示模式',
    'diag.demo_on': '已开启',
    'diag.demo_off': '未开启',
    'diag.refresh': '重新检测',
    'diag.refreshing': '检测中…',
    'diag.ready_template': '离线模式-模板对话已就绪',
    'diag.ready_template_enhanced': '离线模式-模板对话已就绪（情感感知增强中）',
    'diag.enter_demo': '进入演示模式（一键注入 30 天数据）',
    'diag.main_process': '主进程健康',
    'diag.main_degraded': '检测到内部错误：{message}（数据仍在本机，如异常持续请重启应用）',
    'main.degraded_toast': '应用内部发生错误：{message}（数据仍在本机，如异常持续请重启应用）',

    'common.confirm_title': '请确认',
    'common.delete_confirm_title': '确认删除',

    // 演示模式
    'settings.demo_active': '演示模式已激活',
    'settings.demo_banner': '演示模式 · 数据为模拟数据',
    'settings.demo_inject': '一键注入 30 天演示数据',
    'settings.demo_inject_desc': '生成 30 天确定性模拟数据（正常→压力→焦虑→危机→恢复，含 2 次预警事件）',
    'settings.demo_clear': '清理演示数据',
    'settings.demo_clear_confirm': '确定要清理演示数据吗？将清空全部业务数据（偏好设置保留）。',
    'settings.demo_inject_confirm': '将清空当前业务数据并注入 30 天演示数据，继续？',
    'settings.demo_data_clear_btn': '清理演示数据',
    'settings.demo_data_clear_confirm': '确定要清理演示数据吗？业务数据将被清空（偏好设置保留），演示模式将关闭。',
    'settings.demo_data_clear_success': '已清理演示数据',

    // 证据链
    'evidence.title': '风险证据链',
    'evidence.total': '总分',
    'evidence.level': '风险等级',
    'evidence.contributions': '信号贡献',
    'evidence.triggers': '触发依据',
    'evidence.actions': '建议动作',
    'evidence.escalation': '临床升级',
    'evidence.disclaimer': '免责声明',
    'evidence.method_ref': '方法说明',
    // 方法说明弹窗（摘要 + 全文）
    'method.title': '方法说明',
    'method.view_full': '查看完整方法说明',
    'method.doc_ref': '完整文档',
    'method.disclaimer': '统计预测 ≠ 医疗诊断。本应用不替代专业医疗。',
    'method.evidence_summary': '综合风险分 = 5 大信号（情绪/行为/量表/聊天/日记）加权求和（0-100），信号来源与权重见完整说明。',
    'method.prediction_summary': '7 日趋势与风险升级概率基于近期情绪/行为数据，用统计学习模型（线性回归 / 逻辑回归）计算，非神经网络。',
    'method.position_title': '方法定位',
    'method.position_body': 'FriendOS 的风险预警 = 多信号可解释风险评估（统计加权）+ 统计早期预警（移动平均 / 线性回归 / 逻辑回归）+ ML 情感/危机识别（ONNX 4 分类）。\n真正的机器学习（神经网络）只有情感/危机文本分类；风险评分、早期预警、趋势预测均为可解释的统计方法，不声称"AI 预测"。',
    'method.boundary_title': 'ML 与统计边界',
    'method.boundary_body': '情感 4 分类（negative/neutral/positive/crisis）= ONNX 神经网络（真 ML）。\n危机关键词预筛 = 人工规则表。\n综合风险评分 = 5 信号统计加权。\n早期预警等级 = 移动平均 + 斜率统计。\n7 日情绪预测 + 风险升级概率 = 线性回归 + 逻辑回归（纯 JS 统计学习）。\n个人基线对比 = 均值 ± 标准差。',
    'method.weight_title': '风险评分权重',
    'method.weight_body': '情绪分析（emotion）0.30；行为异常（behavior）0.25；评估量表（assessment，PHQ-9/GAD-7/PSS-10/C-SSRS）0.25；聊天情感（chat）0.10；日记情绪（diary）0.10。\n总分 = Σ(各信号分 × 权重)，clamp 到 [0, 100]。',
    'method.threshold_title': '风险等级阈值',
    'method.threshold_body': '0-25 低风险；26-50 中低；51-75 中；76-90 高；91-100 危急（触发临床升级）。\n阈值映射自 PHQ-9 严重度分级。',
    'method.trend_title': '趋势预测方法',
    'method.trend_body': '基于近 7 天情绪与行为序列：线性回归拟合情绪趋势线，逻辑回归估算风险升级概率。\n预测仅作早期提示，需结合综合风险分与临床量表综合判断。',
    'evidence.view': '查看证据链',
    'evidence.no_data': '暂无数据',
    'evidence.status_elevated': '升高',
    'evidence.status_normal': '正常',
    'evidence.status_no_data': '无数据',
    'evidence.action_diary': '写一篇日记，记录此刻',
    'evidence.action_breathing': '做一次呼吸练习',
    'evidence.action_assessment': '完成一次量表评估',
    'evidence.action_hotline': '拨打心理援助热线',
    'evidence.escalation_true': '已触发临床升级',
    'evidence.escalation_false': '未触发临床升级',
    'evidence.disclaimer_text': '本评分基于统计规则与 ML 情感识别，不构成医疗诊断。',
    'evidence.reason_score_threshold': '综合分数超过 91 分阈值',
    'evidence.reason_cssrs_acute': 'C-SSRS 提示急性风险（意图/计划/行为）',
    'evidence.reason_multi_channel_crisis': '≥2 个危机信号源（多通道危机收敛）',

    // 隐私面板
    'privacy.title': '隐私与数据安全',
    'privacy.desc': '了解你的数据如何被保护',
    'privacy.local_only': '数据只在本机',
    'privacy.local_only_desc': '所有日记、评估、对话数据仅存储在你的设备上（IndexedDB），不会上传到任何服务器。',
    'privacy.encryption': '加密方式',
    'privacy.encryption_desc': '敏感字段使用 AES-GCM 加密，密钥由你的密码经 PBKDF2（10 万次迭代）派生，密钥不进 IPC、不进日志。',
    'privacy.storage_location': '本地存储位置',
    'privacy.storage_location_desc': '数据存放在应用的用户数据目录（userData）中，可在设置-数据管理中点击"打开文件夹"查看。',
    'privacy.no_network': '不联网声明',
    'privacy.no_network_desc': '情感分析、风险评分、预测全部在本地完成；仅在你主动配置云对话 API Key 时，对话内容才会发送到云服务商（由主进程代理，渲染层不持有 Key）。',
    'privacy.api_key_secure': 'API Key 加密存储',
    'privacy.api_key_secure_desc': 'API Key 使用操作系统安全存储（DPAPI / safeStorage）加密保存，不会明文落盘。',

    // Onboarding 引导
    'onboarding.skip': '跳过引导',
    'onboarding.prev': '上一步',
    'onboarding.next': '下一步',
    'onboarding.start': '开始使用',
    'onboarding.step1_title': '写日记，记录生活',
    'onboarding.step1_desc': '每天花几分钟写下你的想法和感受。系统会温柔地留意你的情绪变化，无需填写任何问卷。',
    'onboarding.step1_tip': '日记是你与自己对话的方式',
    'onboarding.step2_title': '知己助手，随时陪伴',
    'onboarding.step2_desc': '与知己聊天获得陪伴。离线也能用：情感识别 + 多轮共情对话，在你情绪低落时主动关心你。',
    'onboarding.step2_tip': '断网也能聊，不会穿帮',
    'onboarding.step3_title': '情绪分析，默默陪伴',
    'onboarding.step3_desc': '通过日常写作、聊天、任务完成等行为，自动分析心理健康状况，生成情绪趋势、健康画像与 7 日预测。',
    'onboarding.step3_tip': '静默进行，不打扰你的日常',
    'onboarding.step4_title': '治疗练习，自我关怀',
    'onboarding.step4_desc': '提供 CBT 思维记录、呼吸练习、正念冥想等专业工具，帮助你更好地管理情绪。',
    'onboarding.step4_tip': '发现高风险时会自动弹出危机干预',

    // 预测（P2-2）
    'pred.title': '7 日情绪预测',
    'pred.risk_upgrade': '风险升级概率',
    'pred.trend': '趋势',
    'pred.trend_rising': '上升',
    'pred.trend_stable': '平稳',
    'pred.trend_falling': '下降',
    'pred.method': '方法',
    'pred.note': '说明',
    'pred.disclaimer': '统计预测 ≠ 医疗诊断',
    'pred.stat_note': '统计学习预测，非诊断。预测基于历史数据中的统计规律（线性回归 / 逻辑回归），结果仅供自我观察参考。',
    'pred.no_data': '需要至少 7 天数据才能预测',
    'pred.confidence': '置信度',
    'pred.method_logistic': '逻辑回归（统计学习）',
    'pred.method_linear': '线性回归（统计学习）',
    'pred.method_heuristic': '启发式回退（样本不足）',
    'pred.loading': '正在计算预测…',
    'pred.baseline_compare': '个人基线 vs 当前',
    'pred.baseline': '基线',
    'pred.current': '当前',
    'pred.forecast': '预测',
    'pred.y_axis': '情绪得分 1-5（5=状态最佳）',

    // 布局徽标
    'nav.demo_mode': '演示模式',
    'nav.privacy': '数据本地化',
    'nav.diagnostics': '自检',

    // 情绪页
    'emotion.title': '情绪分析',
    'emotion.subtitle': '温柔留意你的心理健康状态',
    'emotion.monitoring': '实时监测中',
    'emotion.active_days': '活跃天数',
    'emotion.active_days_desc': '近30天',
    'emotion.index': '情绪指数',
    'emotion.records': '分析记录',
    'emotion.high_risk': '高风险',
    'emotion.trend': '情绪趋势',
    'emotion.days': '天',
    'emotion.health_profile': '心理健康画像',
    'emotion.prediction': '情绪趋势预测',
    'emotion.insights': 'AI 洞察',
    'emotion.suggestions': '建议',
    'emotion.write_first': '开始写第一篇日记吧 →',
    'emotion.distribution': '情绪分布',

    // 危机伦理（P0-7）
    'crisis.hotline_unified_name': '全国统一心理援助热线',
    'crisis.hotline_unified_desc': '24 小时',
    'crisis.not_medical': '我不能替代专业医疗。',
    'crisis.resource_title': '干预资源',
    'crisis.nearby_hospital': '就近就医',
    'crisis.nearby_hospital_desc': '如症状持续或加重，请尽快前往最近的医院心理科 / 精神科就诊。',
    'crisis.disclaimer': '本应用提供的是自我关注与陪伴工具，不构成医疗诊断或治疗建议。',

    // 治疗页干预资源区
    'therapy.resource_title': '干预资源',
    'therapy.resource_desc': '如果你或身边的人正在经历心理困扰，以下资源可以提供帮助',
    'therapy.hotlines': '心理援助热线',
    'therapy.nearby_hospital': '就近就医',
    'therapy.nearby_hospital_desc': '如症状持续或加重，请尽快前往最近的医院心理科 / 精神科就诊',
    'therapy.disclaimer': '本应用提供的是自我关注与陪伴工具，不构成医疗诊断或治疗建议。',

    // 本地自进化（知己度 + 反馈触点）
    'selfevo.title': '知己度',
    'selfevo.subtitle': '根据你的本地反馈持续校准，越用越懂你',
    'selfevo.score': '默契指数',
    'selfevo.score_desc': '综合情绪理解、风险判断、干预推荐三个维度的校准程度',
    'selfevo.dim_sentiment': '情绪理解',
    'selfevo.dim_risk': '风险判断',
    'selfevo.dim_intervention': '干预推荐',
    'selfevo.timeline': '近 30 天自进化',
    'selfevo.timeline_empty': '还没有反馈。写日记时点「不对？」纠正一次，知己就开始懂你。',
    'selfevo.calibrated': '已按 {count} 次反馈校准',
    'selfevo.sample_insufficient': '样本还少，先按通用模型',
    'selfevo.confidence_source': '预测置信度来源',
    'selfevo.confidence_source_desc': '本设备本地反馈 + 可解释统计校准（不联网、不上传）',
    'selfevo.disclaimer': '个性化基于本设备反馈，跨设备不共享；统计校准 ≠ 医疗诊断。',
    'selfevo.reset': '重置个性化校准',
    'selfevo.reset_desc': '清空本地学习参数，恢复通用模型',
    'selfevo.reset_success': '已重置个性化校准',
    'selfevo.timeline_sentiment': '情感纠错',
    'selfevo.timeline_risk': '风险校准',
    'selfevo.timeline_intervention': '干预反馈',
    'selfevo.timeline_forecast': '预测反馈',
    'selfevo.timeline_behavior': '行为洞察',
    'selfevo.timeline_early_warning': '预警反馈',
    'selfevo.timeline_other': '其他反馈',
    'feedback.correct_title': '不对？',
    'feedback.correct_negative': '消极',
    'feedback.correct_neutral': '平静',
    'feedback.correct_positive': '积极',
    'feedback.correct_crisis': '危机',
    'feedback.risk_over': '偏高',
    'feedback.risk_just': '正好',
    'feedback.risk_under': '偏低',
    'feedback.intervention_helpful': '有帮助',
    'feedback.intervention_neutral': '一般',
    'feedback.intervention_not_helpful': '没帮助',
    'feedback.thanks': '谢谢反馈',
    'feedback.disabled_crisis': '危机场景暂不支持纠错',

    'nav.privacy_policy': '隐私政策',
    'privacy_policy.title': '隐私政策',
    'privacy_policy.updated': '更新日期：2026 年 8 月 14 日',
    'privacy_policy.intro': '「知己 FriendOS」是一款本地优先、隐私优先的心理健康陪伴应用。我们深知心理健康数据属于高度敏感的个人信息，因此把「数据不出设备」作为产品架构的第一原则。请在使用前阅读本政策，了解我们如何处理你的数据。',
    'privacy_policy.s1_title': '适用范围',
    'privacy_policy.s1_body': '本政策适用于「知己 FriendOS」桌面应用（Windows / Linux）的全部功能，包括日记、任务、习惯、记忆、聊天陪伴、心理量表、情绪与风险分析、局域网同步等模块。本应用无需注册账号，不收集你的姓名、学号、联系方式等身份信息。',
    'privacy_policy.s2_title': '我们收集与处理的数据',
    'privacy_policy.s2_body': '你在应用中主动输入的内容：日记文字、聊天消息、任务与习惯、量表作答、思维记录等；\n应用自动生成的本地分析结果：情绪极性、风险评分、健康画像、行为基线等派生数据。\n以上数据均属于敏感个人信息，仅在你的设备本地产生、存储与处理，开发者与任何第三方均无法访问。',
    'privacy_policy.s3_title': '数据存储位置与加密',
    'privacy_policy.s3_body': '所有数据保存在本机（IndexedDB 与本地文件），不上传任何服务器。\n日记内容、反馈日志、自进化参数等敏感字段采用 AES-GCM 字段级加密后落盘，加密密钥由你的应用锁密码经 PBKDF2（10 万次迭代）派生，密钥不进入进程间通信、不写入日志。\n你可以在「设置」中开启应用锁，为应用增加一层密码保护。',
    'privacy_policy.s4_title': '本地 AI 分析与模型',
    'privacy_policy.s4_body': '情感识别（ONNX 模型）与对话陪伴（本地 Qwen 模型）均在设备端完成推理，分析过程不需要网络，你的文本不会发送给任何模型服务商。\nAI 生成的判断仅供参考，不构成医疗诊断；健康画像与风险评分的方法说明随应用文档公开。',
    'privacy_policy.s5_title': '可选的云端大模型',
    'privacy_policy.s5_body': '只有在你主动配置 API 密钥并选择云端模型时，对话内容才会经主进程代理转发给你选择的服务商（如通义千问、DeepSeek），用于生成回复。\nAPI 密钥经操作系统密钥链（DPAPI）加密存储，不进入渲染层、不写入日志；你可以随时在设置中清除密钥。未配置密钥时，应用完全离线运行。',
    'privacy_policy.s6_title': '局域网同步',
    'privacy_policy.s6_body': '「手机同步」功能仅在你自己主动启动服务并扫码连接后，在局域网内点对点传输数据，使用 Token 认证，不经过任何公网服务器。关闭同步服务后即停止一切网络传输。',
    'privacy_policy.s7_title': '危机干预与医疗免责',
    'privacy_policy.s7_body': '当应用检测到你表达危机信号（如自伤意念）时，会弹出危机干预窗口，提供全国心理援助热线（12356、400-161-9995 等）与专业求助建议。\n本应用是陪伴与自我管理工具，不能替代医生、心理咨询师或任何专业医疗机构的诊断与治疗。如果你正处于危机之中，请立即联系信任的人或拨打专业援助热线。',
    'privacy_policy.s8_title': '数据导出与删除',
    'privacy_policy.s8_body': '你随时可以在「设置 → 数据管理」中一键导出全部数据（JSON 格式），或清除全部本地数据；卸载应用后，本机残留数据文件可手动删除（数据存储目录见应用内说明）。',
    'privacy_policy.s9_title': '未成年人保护',
    'privacy_policy.s9_body': '心理健康数据属于敏感个人信息。如果你未满 18 周岁，建议在父母或其他监护人知情并陪同的情况下使用本应用；监护人对未成年人使用网络产品的行为负有监护责任。',
    'privacy_policy.s10_title': '政策更新与联系我们',
    'privacy_policy.s10_body': '本政策依据《中华人民共和国个人信息保护法》《中华人民共和国网络安全法》《中华人民共和国未成年人保护法》制定。\n政策如有更新，将在应用更新说明中公告，更新日期见页首。\n如对本政策有任何疑问，请通过 GitHub 仓库（github.com/Fnk000044/FriendOS）与我们联系。',

    'nav.safety_plan': '安全计划',
    'safety_plan.title': '我的安全计划',
    'safety_plan.desc': '提前写下应对危机的六步计划，困难时刻它会在你身边。内容仅保存在本机并加密。',
    'safety_plan.load_fail': '安全计划读取失败',
    'safety_plan.save_fail': '安全计划保存失败',
    'safety_plan.not_created': '还没有制定安全计划',
    'safety_plan.not_created_desc': '在平静的时候写下你的预警信号、应对策略与求助资源，危急时刻可以一键查看。整个过程只需几分钟。',
    'safety_plan.create_btn': '开始制定',
    'safety_plan.step1_title': '我的预警信号',
    'safety_plan.step1_ph': '例：连续失眠、不想见人、反复想"没意思"、总是自责……',
    'safety_plan.step1_hint': '当这些信号出现时，说明我需要启动安全计划了。',
    'safety_plan.step2_title': '我自己能做的事',
    'safety_plan.step2_ph': '例：做 4-7-8 呼吸、出门散步 20 分钟、听喜欢的歌、写日记……',
    'safety_plan.step2_hint': '不需要任何人帮忙，我自己就能立刻开始的应对方式。',
    'safety_plan.step3_title': '能转移注意力的人与事',
    'safety_plan.step3_ph': '例：约室友打球、去图书馆、参加社团活动、看一部电影……',
    'safety_plan.step3_hint': '让自己从痛苦的想法里走出来的人和事。',
    'safety_plan.step4_title': '我可以信赖的人',
    'safety_plan.step4_ph': '例：妈妈 138xxxx、室友小王、辅导员李老师……',
    'safety_plan.step4_hint': '关键时刻可以打电话、发消息求助的人（名字 + 联系方式）。',
    'safety_plan.step5_title': '专业求助资源',
    'safety_plan.step5_ph': '例：学校心理中心、全国心理援助热线 12356 / 400-161-9995、最近的三甲医院心理科……',
    'safety_plan.step5_hint': '专业人员与机构永远是你最可靠的后盾。',
    'safety_plan.step6_title': '我活下去的理由',
    'safety_plan.step6_ph': '例：家人、还没实现的梦想、一直陪着我的猫、下个假期想去的旅行……',
    'safety_plan.step6_hint': '痛苦会过去，但这些理由一直都在。',
    'safety_plan.empty_field': '（尚未填写）',
    'safety_plan.disclaimer': '安全计划是自我支持工具，用于危机时刻的自我提醒，不能替代专业医疗与心理治疗。如果你正处于危机之中，请立即拨打 12356 或 400-161-9995，或联系身边可信任的人。',
    'safety_plan.crisis_title': '此刻需要帮助？',
    'safety_plan.crisis_desc': '如果你正处于强烈的痛苦中，请优先联系专业援助，而不是独自承受。全国心理援助热线 24 小时在线：',
    'safety_plan.edit': '编辑计划',
    'safety_plan.save': '保存计划',
    'safety_plan.cancel': '取消',
    'safety_plan.saved': '安全计划已保存',
    'safety_plan.updated_at': '上次更新',
    'safety_plan.go_therapy': '去做放松练习',
    'safety_plan.open_from_crisis': '查看我的安全计划',

    'report.export_pdf': '导出 PDF',
    'report.export_pdf_success': '报告已导出',
    'report.export_pdf_fail': 'PDF 导出失败',
    'report.export_pdf_no_data': '请先生成报告',

    'knowledge.desc': '关于常见心理困扰的科普知识，全部离线可用，随取随看。',
    'knowledge.search_placeholder': '搜索想了解的问题，如：考前焦虑、失眠、社恐…',
    'knowledge.all_categories': '全部',
    'knowledge.no_results': '没有找到相关内容，换个关键词试试。',
    'knowledge.tips': '可以试试这样做',
    'knowledge.hotline_note': '如果你或身边的人正处于危机之中，请立即寻求专业帮助：',
    'knowledge.disclaimer': '科普内容仅供心理教育参考，不能替代医生、心理咨询师等专业人士的诊断与治疗。',
    'knowledge.open_safety_plan': '为危机时刻制定安全计划',
    'chat.suggest_knowledge': '心理知识库',
    'chat.knowledge_hint': '想了解更多？看看',
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  },

  en: {
    'app.title': 'ZhiJi',

    'nav.dashboard': 'Dashboard',
    'nav.risk': 'Risk Assessment',
    'nav.tasks': 'Tasks',
    'nav.diary': 'Diary',
    'nav.habits': 'Habits',
    'nav.memories': 'Memories',
    'nav.emotion': 'Emotion',
    'nav.therapy': 'Therapy',
    'nav.reports': 'Review',
    'nav.settings': 'Settings',
<<<<<<< HEAD
    'nav.about': 'About',
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'nav.data_local': 'All data stored locally',
    'nav.group_daily': 'Daily',
    'nav.group_analysis': 'Insights',
    'nav.group_tools': 'Tools',
    'nav.group_system': 'System',
<<<<<<< HEAD
    'nav.assistant': 'Zhiyou Assistant',
=======
    'nav.assistant': 'AI Assistant',
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'nav.assessment': 'Assessment',

    'nav.sync': 'Phone Sync',
    'nav.knowledge': 'Knowledge',
    'nav.resources': 'Resources',

    'sync.title': 'Phone Sync',
    'sync.description': 'Scan QR code to sync data from your phone',
    'sync.scan_to_connect': 'Scan with the FriendOS Android App',
    'sync.server_status_running': 'Server Running',
    'sync.server_status_stopped': 'Server Stopped',
    'sync.start_server': 'Start Server',
    'sync.stop_server': 'Stop Server',
    'sync.network_info': 'Network Info',
    'sync.ip_address': 'IP Address',
    'sync.port': 'Port',
    'sync.no_synced_items': 'No synced items yet',
    'sync.received_items': 'Received {count} items',

    'assistant.title': 'AI Personal Assistant',
    'assistant.placeholder': 'Type a message...',
    'assistant.send': 'Send',
    'assistant.loading': 'Thinking...',
    'assistant.welcome_title': "Hello, I'm ZhiJi AI",
    'assistant.welcome_desc': 'I can analyze plans, summarize status, offer advice',
    'assistant.error': 'An error occurred, please try again later',
    'assistant.suggest_analyze': 'Analyze my plans',
    'assistant.suggest_status': 'Check my status',
    'assistant.suggest_help': 'What can you do',
    'assistant.clear': 'Clear chat',
    'chat.offline_mode': 'Offline companion mode',
    'chat.cloud_mode': 'Cloud chat connected',
<<<<<<< HEAD
    'chat.source_local': 'Local',
    'chat.source_cloud': 'Cloud',
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'chat.welcome': 'Talk to ZhiJi, I am listening.',
    'chat.input_placeholder': 'Say something…',
    'chat.disclaimer': 'ZhiJi is a companion, not a substitute for professional care. In crisis call 400-161-9995.',
    'chat.suggest_diary': 'Write diary',
    'chat.suggest_breathing': 'Breathing',
    'chat.suggest_assessment': 'Assessment',
    'chat.settings_title': 'AI Chat Settings',
    'chat.settings_desc': 'Configure to enable cloud chat. Without config, offline companion mode is used, data stays local.',
    'chat.provider': 'Provider',
    'chat.api_key': 'API Key',
    'chat.api_key_placeholder': 'Paste API Key (encrypted)',
    'chat.test_connection': 'Test connection',
    'chat.testing': 'Testing…',
    'chat.test_success': 'Connected, latency {latency}ms, model {model}',
    'chat.test_fail': 'Failed: {error}',
    'chat.no_key': 'Not configured',
    'chat.save_key': 'Save',
<<<<<<< HEAD
    'chat.model_name': 'Model name',
    'chat.save_model': 'Save model',
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193

    'header.quick_capture': 'Ctrl+K Quick Capture',

    'quick_capture.title': 'Quick Capture',
    'quick_capture.placeholder': 'Write your thoughts...',
    'quick_capture.save': 'Save',
    'quick_capture.cancel': 'Cancel',
    'quick_capture.todo': 'Todo',
    'quick_capture.diary': 'Diary',
    'quick_capture.idea': 'Idea',
    'quick_capture.memory': 'Memory',
    'quick_capture.uncategorized': 'Uncategorized',
    'quick_capture.auto_classify': 'Auto-classification supported',
    'quick_capture.saved_as': 'Saved as',
    'quick_capture.hint': '⌘+Enter to save',

    'welcome.title': 'Welcome to ZhiJi',
    'welcome.subtitle': 'Personal Management System',
    'welcome.select_lang': 'Choose your language',
    'welcome.start': 'Get Started',
    'welcome.zh_desc': 'Chinese interface',
    'welcome.en_desc': 'English interface, suitable for global users',

    'task.title': 'Task Management',
    'task.input_placeholder': 'Add a new task, press Enter to create',
    'task.all': 'All',
    'task.pending': 'Pending',
    'task.completed': 'Completed',
    'task.overdue': 'Overdue',
    'task.urgent': 'Urgent',
    'task.high': 'High',
    'task.medium': 'Medium',
    'task.low': 'Low',
    'task.rolled_over': 'Auto-rolled over',
    'task.from': 'from',
    'task.expired': 'Overdue',
    'task.detail': 'Task Details',
    'task.delete': 'Delete',
    'task.save': 'Save',
    'task.cancel': 'Cancel',
    'task.title_label': 'Title',
    'task.description_label': 'Description',
    'task.priority_label': 'Priority',
    'task.scheduled_date_label': 'Scheduled Date',
    'task.tags_label': 'Tags',
    'task.status_filter': 'Status',
    'task.priority_filter': 'Priority',
    'task.rollover_notice': 'Auto-rolled from {date}',
    'task.more': '{count} more...',
    'task.rollover_banner': 'Auto-rolled {count} unfinished tasks to today',
    'task.new_task': 'New Task',
    'task.create': 'Create',
    'task.repeat_toggle': 'Repeat task',
    'task.repeat_interval': 'Duration (days)',
    'task.repeat_end': 'Start date',
    'task.no_tasks': 'No tasks',
    'task.no_tasks_desc': 'Add a new task to get started',
    'task.loading': 'Loading tasks...',
    'task.today': 'Today',
    'task.yesterday': 'Yesterday',
    'task.tomorrow': 'Tomorrow',
    'task.stats.all': 'All Tasks',
    'task.stats.today': "Today's Tasks",
    'task.stats.pending': 'Pending',
    'task.stats.completed': 'Completed',
    'task.stats.rollover': 'Auto-rollover',
    'task.rolled_to_tomorrow': 'Rolled to tomorrow',
    'task.title_required': 'Title is required',
    'task.pending_rollover': 'Pending rollover',

    'diary.title': 'Diary',
    'diary.write': 'Write Diary',
    'diary.no_entries': 'No diary entries',
    'diary.no_entries_desc': 'Record your first day',
    'diary.write_first': 'Write First Entry',
    'diary.title_placeholder': 'Title (optional)',
    'diary.content_placeholder': 'Write your feelings, experiences, thoughts...',
    'diary.weather': 'Weather',
<<<<<<< HEAD
    'diary.tags': 'Tags',
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'diary.save': 'Save',
    'diary.update': 'Update',
    'diary.save_emotion_fail': 'Emotion record failed to save, but diary was saved',
    'diary.cancel': 'Cancel',
    'diary.back': 'Back to Diary',
    'diary.weather_placeholder': 'Weather ☀️',
    'diary.tags_placeholder': 'Add tags',
    'diary.loading': 'Loading diary...',

    'habit.title': 'Habit Tracker',
    'habit.create': 'New Habit',
    'habit.no_habits': 'No habits yet',
    'habit.no_habits_desc': 'Create a habit to start tracking',
    'habit.name': 'Habit Name',
    'habit.name_placeholder': 'e.g. Read for 30 minutes',
    'habit.desc': 'Description (optional)',
    'habit.color': 'Color',
    'habit.create_btn': 'Create',
    'habit.cancel': 'Cancel',
    'habit.log': 'Log',
    'habit.logged': 'Logged',
    'habit.streak_days': 'day streak',
    'habit.daily': 'Daily',
    'habit.times': '×',
    'habit.loading': 'Loading habits...',

    'memory.title': 'Memory Vault',
<<<<<<< HEAD
    'memory.description': 'Automatically collects key info from your chats, diaries and tasks for quick recall',
    'memory.go_diary': 'Write a diary entry',
    'memory.go_chat': 'Chat with Zhiyou',
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'memory.create': 'New Memory',
    'memory.edit': 'Edit Memory',
    'memory.no_memories': 'No memories yet',
    'memory.no_memories_desc': 'Start recording your thoughts and knowledge',
    'memory.search_placeholder': 'Search memories by title, content, tags...',
    'memory.all_categories': 'Categories',
    'memory.title_placeholder': 'Give your memory a title',
    'memory.content_placeholder': 'Record knowledge, thoughts, insights...',
    'memory.type': 'Type',
    'memory.source': 'Source (optional)',
    'memory.category': 'Category',
    'memory.tags': 'Tags',
    'memory.save': 'Save',
    'memory.update': 'Update',
    'memory.cancel': 'Cancel',
    'memory.manual': 'Manual',
    'memory.idea': 'Idea',
    'memory.insight': 'Insight',
    'memory.diary_extract': 'Diary',
    'memory.bookmark': 'Bookmark',
    'memory.other': 'Other',
    'memory.title_label': 'Title',
    'memory.content_label': 'Content',
    'memory.type_label': 'Type',
    'memory.category_label': 'Category',
    'memory.category_header': 'Categories',
    'memory.source_label': 'Source (optional)',
    'memory.source_placeholder': 'e.g. Reading notes, project experience',
    'memory.tags_label': 'Tags',
    'memory.default_category': 'Default',
    'memory.loading': 'Loading memories...',
    'memory.all': 'All',
    'memory.all_memories': 'All Memories',
    'memory.candidates': 'Candidates',
    'memory.candidates_empty': 'No candidates',
    'memory.candidates_empty_desc': 'Keep writing diaries and completing tasks',
    'memory.candidates_select_all': 'Select All',
    'memory.candidates_confirm': 'Confirm as Memory ({n})',
    'memory.candidates_reject': 'Reject ({n})',
    'memory.candidates_source_diary': 'Source: Diary',
    'memory.candidates_source_task': 'Source: Task',
    'memory.candidates_source_capture': 'Source: Quick Capture',
    'memory.candidates_scan': 'Scan',
    'memory.candidates_found': 'Found {count} candidates',
    'memory.candidates_none': 'No new candidates found',
    'memory.candidates_error': 'Scan failed',
    'memory.candidates_ai_toggle': 'AI Extraction',
    'memory.candidates_ai_scan': 'AI analyzing...',

    'report.title': 'Reports',
    'report.daily': 'Daily',
    'report.weekly': 'Weekly',
    'report.monthly': 'Monthly',
    'report.task_rate': 'Task Rate',
    'report.tasks_done': 'Tasks Done',
    'report.diary_days': 'Diary Days',
    'report.mood_avg': 'Avg Mood',
    'report.habit_rate': 'Habit Rate',
    'report.word_count': 'Word Count',
    'report.task_chart': 'Task Completion',
    'report.mood_chart': 'Mood Trend',
    'report.habit_chart': 'Habit Rate',
    'report.total': 'Total',
    'report.completed': 'Completed',
    'report.loading': 'Generating report...',
    'report.select_hint': 'Select a report type to start',
<<<<<<< HEAD
    'report.ai_report': 'Mental Health Analysis Report',
=======
    'report.ai_report': 'AI Analysis Report',
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'report.insights': 'Insights',
    'report.suggestions': 'Suggestions',
    'report.health_radar': 'Health Profile',
    'report.emotion_trend': 'Emotion Trend',
    'report.no_emotion_data': 'No emotion data yet',
<<<<<<< HEAD
    'report.view_emotion_page': 'View emotion analysis',
    'report.no_data': 'No data',
    'report.today': 'Today',
    'report.latest_habit_day': 'Latest check-in day',
=======
    'report.no_data': 'No data',
    'report.today': 'Today',
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'report.avg_rate': 'Avg. Rate',
    'report.trend': 'Trend',

    'settings.title': 'Settings',
    'settings.data_mgmt': 'Data Management',
    'settings.data_desc': 'All data is stored locally. Regular backup recommended.',
    'settings.export': 'Export Data',
    'settings.import': 'Import Data',
    'settings.storage_info': 'Storage Info',
    'settings.storage_desc': 'Data stored in browser IndexedDB',
    'settings.about': 'About ZhiJi',
<<<<<<< HEAD
    'about.zhiyou': 'Zhiyou',
    'about.tagline': 'Local-first · Privacy-first mental health companion',
    'about.intro': 'Zhiyou is a local-first desktop mental health app: explainable multi-signal risk assessment + statistical early warning + ML emotion/crisis recognition. All data stays on your device.',
    'about.version': 'Version',
    'about.tech_stack': 'Electron + React + local models',
    'about.ethics': 'Ethics: this app provides companionship and early risk hints, and does not replace professional medical diagnosis or treatment.',
    'about.helpline': 'Psychological helpline',
    'about.helpline_desc': 'If you or someone around you is experiencing distress, please call:',
    'about.not_medical': 'I cannot replace professional care. In emergencies call 120 or go to the nearest hospital.',
    'about.credits': 'Credits',
    'about.credits_desc': 'Thanks to the open-source community and psychology researchers. Built for the Qingyuan Cup AI Innovation Competition.',
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'settings.about_desc': 'Personal Management System v1.0. All data stored locally, no server upload.',
    'settings.model_status': 'Sentiment Analysis Model',
    'settings.model_status_desc': 'Keyword analysis is always available. Training the ONNX model improves accuracy.',
    'settings.demo_data': 'Demo Data',
    'settings.demo_data_desc': 'Fill with preset data for demos and presentations.',
    'settings.demo_data_btn': 'Fill Demo Data',
    'settings.demo_data_confirm': 'Filling demo data will clear all current data. Continue?',
    'settings.demo_data_success': 'Demo data filled successfully!',
    'settings.demo_data_fail': 'Failed to fill demo data',
    'settings.open_folder': 'Open Data Folder',
<<<<<<< HEAD
    'settings.change_location': 'Change storage location',
    'settings.location_migrated': 'Data migrated to the new location',
    'settings.location_restart_hint': 'Restart is required to use the new location. Restart now?',
    'settings.location_migrate_fail': 'Migration failed, please retry',
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'settings.reset': 'Factory Reset',
    'settings.reset_confirm': 'Are you sure? All data will be cleared. This action cannot be undone.',
    'settings.theme': 'Appearance',
    'settings.theme_system': 'System',
    'settings.theme_light': 'Light',
    'settings.theme_dark': 'Dark',
    'settings.shortcuts': 'Keyboard Shortcuts',
    'settings.shortcuts_desc': 'Customize keyboard shortcuts. Click a shortcut to change it.',
    'settings.shortcuts_quick_capture': 'Quick Capture',
    'settings.shortcuts_export': 'Export Data',
    'settings.shortcuts_import': 'Import Data',
    'settings.shortcuts_press_keys': 'Press shortcut...',
    'settings.shortcuts_conflict': 'This shortcut conflicts with system shortcut "{name}". Use anyway?',
    'settings.shortcuts_confirm': 'Use Anyway',
    'settings.shortcuts_reset': 'Reset All',
    'settings.ai': 'AI Settings',
    'settings.ai_desc': 'Configure AI assistant behavior and model',
    'settings.ai_tone': 'Response Tone',
    'settings.ai_tone_professional': 'Professional',
    'settings.ai_tone_friendly': 'Friendly',
    'settings.ai_tone_concise': 'Concise',
    'settings.ai_tone_encouraging': 'Encouraging',
    'settings.ai_tone_counselor': 'Counselor',
    'settings.ai_mode_online': 'Online',
    'settings.ai_mode_offline': 'Offline',
    'settings.ai_offline_tip': 'Offline: Uses local model, no network needed, privacy-first. First load takes ~3-5 seconds.',
    'settings.ai_provider': 'AI Model',
    'settings.ai_api_key': 'API Key',
    'settings.ai_api_key_placeholder': 'Enter API key (stored locally)',
    'settings.ai_model': 'Model',
    'notification.title': 'Notifications',
    'notification.test': 'Test',
    'notification.add': 'Add',
    'notification.cancel': 'Cancel',
    'notification.diary': 'Diary',
    'notification.habit': 'Habit',
    'notification.custom': 'Custom',
    'notification.title_placeholder': 'Reminder title',
    'notification.body_placeholder': 'Reminder body (optional)',
    'notification.empty': 'No reminders',
    'notification.desc': 'Reminders will be sent via system notifications at the scheduled time. Please ensure notification permissions are enabled.',
    'settings.online_model_title': 'Configure Online Model',
    'settings.online_model_desc': 'Select online model provider and enter API Key',
    'settings.online_provider': 'Model Provider',
    'settings.online_model_hint': 'API Key is stored locally only, not synced to other devices',

    'mode_selection.title': 'Select AI Mode',
    'mode_selection.online': 'Online Mode',
    'mode_selection.online_desc': 'Uses DeepSeek API service, requires internet connection',
    'mode_selection.offline': 'Offline Mode',
    'mode_selection.offline_desc': 'Uses local model, no internet needed, privacy protected',
    'mode_selection.hint': 'Online mode requires API Key, offline mode uses local Qwen3-0.6B model',

    'model_download.title': 'Select Local Model',
    'model_download.select': 'Select a local AI model (model files at E:\\FriendOS\\models)',
    'model_download.loading': 'Loading...',
    'model_download.use_model': 'Use This Model',
    'model_download.selected': 'Selected',
    'model_download.path': 'Model files location (see paths listed above)',
    'model_download.cancel': 'Cancel',

    'dashboard.welcome': 'Welcome back',
    'dashboard.today_overview': "Today's Overview",
    'dashboard.today_todos': "Today's Todos",
    'dashboard.no_todos': 'No tasks for today 🎉',
    'dashboard.habit_summary': 'Habit Summary',
    'dashboard.no_habits': 'No habits yet',
    'dashboard.completed': 'completed',
    'dashboard.mood_trend': 'Mood Trend',
    'dashboard.recent_diary': 'Recent Diary',
    'dashboard.view_all': 'View all',
    'dashboard.task_progress': 'Tasks',
    'dashboard.habit_progress': 'Habits',
    'dashboard.stats_today_task': 'Today Tasks',
    'dashboard.stats_week_task': 'Week Tasks',
    'dashboard.stats_week_diary': 'Week Diary',
    'dashboard.stats_habits': 'Habits',
    'dashboard.today_diary': "Today's Diary",
    'dashboard.no_diary_today': "No diary entry today",
    'dashboard.write_diary': 'Write Diary',
    'dashboard.diary_preview': 'Preview',
    'dashboard.habit_checkin': 'Habit Check-in',
    'dashboard.study_checkin': 'Study Check-in',
    'dashboard.week_goal': 'Weekly Goal',
    'dashboard.weekly_review_entries': 'Weekly Review',
    'dashboard.daily_quote': 'Daily Quote',
    'dashboard.edit_quote': 'Edit',
    'dashboard.add_quote': 'Add Quote',
    'dashboard.delete_quote': 'Delete',
    'dashboard.quote_author': 'Author',
    'dashboard.quote_placeholder': 'Write something inspiring for today...',

    'common.confirm': 'Confirm',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.backup_success': 'Data exported successfully',
    'common.backup_fail': 'Export failed',
    'common.import_success': 'Data imported successfully',
    'common.import_fail': 'Import failed. Please check the file format.',
    'common.save_fail': 'Save failed',
    'common.delete_fail': 'Delete failed',
    'common.copy_fail': 'Copy failed',
    'common.empty_title': 'No data yet',
    'common.empty_desc': 'No content yet, create your first entry',
    'common.clickable_card': 'Clickable card',
    'common.tag_input': 'Tag input',
    'common.add_tag': 'Add tag',
    'common.remove_tag': 'Remove tag {name}',
    'common.tag_placeholder': 'Type a tag and press Enter',
    'common.search_placeholder': 'Search...',
    'common.feedback_thanks': 'Thanks for feedback',
    'common.feedback_accurate': 'Accurate',
    'common.feedback_inaccurate': 'Inaccurate',
    'common.feedback_ask': 'Is the analysis accurate?',
    'common.loading_label': 'Loading',
    'quick_capture.type_label': 'Type:',
    'mood.1': 'Awful',
    'mood.2': 'Bad',
    'mood.3': 'Okay',
    'mood.4': 'Good',
    'mood.5': 'Great',
    'common.hint': '💡 Natural language classification supported',
    'common.load_more': 'Load more',
    'common.delete_confirm': 'Are you sure you want to delete? This cannot be undone.',

    // Crisis intervention
    'crisis.title': 'We Care About You',
    'crisis.subtitle': 'You are not alone, help is available',
    'crisis.description_1': 'We noticed you may be going through a difficult time. Remember, ',
    'crisis.description_2': 'seeking help is a sign of strength',
    'crisis.description_3': ', and you deserve care and support.',
    'crisis.description_4': 'If you are in crisis, please call the hotline below. Professional counselors are ready to help.',
    'crisis.hotline_title': 'Crisis Hotlines',
    'crisis.online_counseling': 'Online counseling: ',
    'crisis.close_button': 'I understand, close',
    'crisis.countdown': 'Close in {seconds}s',
    'crisis.aria_label': 'Crisis Intervention',
<<<<<<< HEAD
    'crisis.feedback_question': 'Was this alert accurate?',
    'crisis.feedback_accurate': 'Accurate',
    'crisis.feedback_false_alarm': 'False alarm',
    'crisis.feedback_thanks': 'Noted — similar expressions will be gentler next time',
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'crisis.hotline_national_name': 'National Crisis Hotline',
    'crisis.hotline_national_desc': '24/7 free crisis intervention',
    'crisis.hotline_beijing_name': 'Beijing Crisis Center',
    'crisis.hotline_beijing_desc': '24/7 crisis intervention',
    'crisis.hotline_life_name': 'Life Hotline',
    'crisis.hotline_life_desc': 'Professional crisis intervention',
    'crisis.hotline_hope_name': 'Hope 24 Hotline',
    'crisis.hotline_hope_desc': '24/7 youth mental health support',
    'crisis.online_link_cas_label': 'Chinese Academy of Sciences Institute of Psychology',
    'crisis.online_link_bj_label': 'Beijing Crisis Intervention Center',

    // CBT Thought Record
    'therapy.tr_title': 'CBT Thought Record',
    'therapy.tr_subtitle': 'Identify and challenge automatic thoughts',
    'therapy.tr_step_prev': 'Previous',
    'therapy.tr_step_next': 'Next',
    'therapy.tr_step_save': 'Save Record',
    'therapy.tr_step_saving': 'Saving...',
    'therapy.tr_saved_title': 'Saved!',
    'therapy.tr_saved_subtitle': 'Record saved',
    'therapy.tr_saved_desc': 'Emotion intensity changed from {before}% to {after}%',
    'therapy.tr_saved_decreased': ', decreased by {diff}%',
    'therapy.tr_write_another': 'Write Another',
    'therapy.tr_back': 'Back',
    'therapy.tr_step0_title': 'Situation',
    'therapy.tr_step0_desc': 'What happened?',
    'therapy.tr_step0_hint': 'Describe a specific situation that troubled you. Describe the facts objectively, not your thoughts.',
    'therapy.tr_step0_label': 'Situation Description',
    'therapy.tr_step0_ph': 'e.g. In today\'s meeting, my boss criticized my proposal...',
    'therapy.tr_step1_title': 'Automatic Thoughts',
    'therapy.tr_step1_desc': 'What thoughts came to mind?',
    'therapy.tr_step1_hint': 'What thoughts automatically came to mind? These are often instantaneous and automatic.',
    'therapy.tr_step1_label': 'Automatic Thought',
    'therapy.tr_step1_ph': 'e.g. I\'m so useless, I can\'t do anything right...',
    'therapy.tr_step1_distortion_hint': 'Possible cognitive distortions:',
    'therapy.tr_step2_title': 'Emotions',
    'therapy.tr_step2_desc': 'How do you feel?',
    'therapy.tr_step2_hint': 'Select the emotions you felt (multi-select), and adjust the intensity.',
    'therapy.tr_step2_intensity': 'Emotion Intensity',
    'therapy.tr_step2_intensity_label': 'Emotion Intensity',
    'therapy.tr_step2_intensity_min': 'Mild',
    'therapy.tr_step2_intensity_max': 'Intense',
    'therapy.tr_step3_title': 'Evidence Evaluation',
    'therapy.tr_step3_desc': 'Evidence for and against the thought',
    'therapy.tr_step3_hint': 'Analyze objectively: what evidence supports this thought? What evidence contradicts it?',
    'therapy.tr_step3_for_label': 'Supporting Evidence',
    'therapy.tr_step3_for_ph': 'What facts support this thought?',
    'therapy.tr_step3_against_label': 'Contradicting Evidence',
    'therapy.tr_step3_against_ph': 'What facts do not support this thought?',
    'therapy.tr_step4_title': 'Alternative Thought',
    'therapy.tr_step4_desc': 'What is a more balanced view?',
    'therapy.tr_step4_hint': 'Based on the above analysis, what is a more balanced, objective perspective?',
    'therapy.tr_step4_label': 'Alternative Thought',
    'therapy.tr_step4_ph': 'e.g. Even though my proposal was criticized, it doesn\'t mean I\'m incompetent. I can learn and improve...',
    'therapy.tr_step4_new_intensity': 'Current Emotion Intensity',
    'therapy.tr_step4_decreased_to': 'Emotion intensity dropped from {before}% to {after}%, down by {diff}%!',
    'therapy.tr_step5_title': 'Belief Assessment',
    'therapy.tr_step5_desc': 'How much do you believe the alternative thought?',
    'therapy.tr_step5_hint': 'How much do you believe this alternative thought? (0-100%)',
    'therapy.tr_step5_belief': 'Belief Level',
    'therapy.tr_step5_belief_min': 'No belief',
    'therapy.tr_step5_belief_max': 'Full belief',
    'therapy.tr_step5_infobox': 'Belief level helps you track your acceptance of the alternative thought. This number may rise over time.',
    'therapy.tr_step6_title': 'Action Plan',
    'therapy.tr_step6_desc': 'How to verify the new thought?',
    'therapy.tr_step6_hint': 'What can you do to test this new thought? Create a concrete behavioral experiment plan.',
    'therapy.tr_step6_label': 'Behavioral Experiment Plan',
    'therapy.tr_step6_ph': 'e.g. Next time my proposal is criticized, I will ask for specific improvements instead of dismissing myself...',
    'therapy.tr_step6_followup': 'Follow-up Emotion Score (can fill in later)',
    'therapy.tr_step6_followup_min': 'Mild',
    'therapy.tr_step6_followup_max': 'Intense',
    'therapy.tr_step6_infobox': 'Behavioral experiments are a key part of CBT. Testing your thoughts through action helps build healthier thinking patterns.',
    'therapy.tr_emotion_anxiety': 'Anxiety',
    'therapy.tr_emotion_sadness': 'Sadness',
    'therapy.tr_emotion_anger': 'Anger',
    'therapy.tr_emotion_fear': 'Fear',
    'therapy.tr_emotion_shame': 'Shame',
    'therapy.tr_emotion_guilt': 'Guilt',
    'therapy.tr_emotion_loneliness': 'Loneliness',
    'therapy.tr_emotion_despair': 'Despair',
    'therapy.tr_emotion_irritation': 'Irritation',
    'therapy.tr_emotion_confusion': 'Confusion',
    'therapy.tr_dist_catastrophizing': 'Catastrophizing: imagining the worst',
    'therapy.tr_dist_all_or_nothing': 'All-or-Nothing: only good and bad extremes',
    'therapy.tr_dist_overgeneralization': 'Overgeneralization: one failure means forever',
    'therapy.tr_dist_mind_reading': 'Mind Reading: assuming what others think',
    'therapy.tr_dist_should': 'Should Statements: I should/must...',
    'therapy.tr_dist_emotional_reasoning': 'Emotional Reasoning: I feel... so it\'s true',
    'therapy.tr_dist_selective_abstraction': 'Selective Abstraction: focusing on negatives',
    'therapy.tr_dist_labeling': 'Labeling: I\'m a failure',
    'therapy.tr_dist_disqualifying_positive': 'Disqualifying Positive: explaining good as exception',
    'therapy.tr_dist_magnification': 'Magnification: magnify flaws, minimize strengths',
    'therapy.tr_dist_personalization': 'Personalization: it\'s all my fault',
    'therapy.tr_dist_blaming': 'Blaming: it\'s all others\' fault',
    'therapy.tr_dist_unfair_comparison': 'Unfair Comparison: comparing weaknesses to others\' strengths',
    'therapy.tr_dist_regret': 'Regret: if only...',
    'therapy.tr_dist_pessimistic_prediction': 'Pessimistic Prediction: the future will be worse',

    // Emotion overview
    'emotion.health_title': 'Emotional Health',
    'emotion.health_index': 'Emotion Index',
    'emotion.view_detail': 'View details',
    'emotion.no_data': 'No data yet',
    'emotion.no_data_hint': 'Auto-analyzed after you write diary entries',
    'emotion.recent_7d_count': 'Last 7 days: {count} entries',
    'emotion.risk_low': 'Good',
    'emotion.risk_medium_low': 'Low',
    'emotion.risk_medium': 'Medium',
    'emotion.risk_high': 'High',
    'emotion.risk_critical': 'Critical',

    // Risk dashboard
    'risk.dashboard_title': 'Mental Wellbeing Overview',
    'risk.dashboard_subtitle': 'Multi-dimensional analysis that gently supports your mental health',
    'risk.composite_index': 'Composite Risk Index',
    'risk.risk_level': 'Risk Level',
    'risk.level_suffix': 'risk',
    'risk.days_suffix': 'd',
    'risk.baseline_compare': 'Compare to Personal Baseline',
    'risk.mood_score': 'Mood Score',
    'risk.task_rate': 'Task Completion Rate',
    'risk.habit_rate': 'Habit Completion Rate',
    'risk.diary_freq': 'Diary Frequency',
    'risk.baseline_prefix': 'Baseline',
    'risk.health_dim': 'Health Dimensions',
    'risk.health_index_label': 'Health Index',
    'risk.risk_trend': 'Risk Trend',
    'risk.risk_index_label': 'Risk Index',
    'risk.no_data': 'No data',
    'risk.no_trend_data': 'No trend data',
    'risk.signal_analysis': 'Signal Source Analysis',
    'risk.weight_suffix': 'Weight {weight}',
    'risk.weight_suffix_pct': 'Weight {weight}%',
    'risk.risk_factors': 'Risk Factors',
    'risk.signal_emotion': 'Emotion Analysis',
    'risk.signal_behavior': 'Behavior Pattern',
    'risk.signal_assessment': 'Assessment Scale',
    'risk.signal_chat': 'AI Chat',
    'risk.signal_diary': 'Diary Emotion',
    'risk.dim_emotion': 'Emotion',
    'risk.dim_behavior': 'Behavior',
    'risk.dim_assessment': 'Assessment',
    'risk.dim_chat': 'Chat',
    'risk.dim_diary': 'Diary',
    'risk.early_warning': 'Early Warning',
    'risk.early_warning_subtitle': 'Detects deteriorating trends in the last 15 days using sliding windows',
    'risk.days_to_critical': 'Days to critical:',
    'risk.no_warning': 'You are doing well',
    'risk.no_warning_desc': 'No deteriorating signals detected in the last 15 days',
    'risk.warning_green': 'Safe',
    'risk.warning_yellow': 'Mild Warning',
    'risk.warning_orange': 'Moderate Warning',
    'risk.warning_red': 'High Warning',
    'risk.anomaly_score': 'Anomaly Score',
    'risk.refresh': 'Refresh',
    'risk.refreshing': 'Analyzing',
    'risk.partial_data': 'Insufficient data, showing partial signals',
    'risk.trend_title': 'Risk Trend',
    'risk.risk_index': 'Risk Index',
    'risk.level_low': 'Low risk',
    'risk.level_medium': 'Medium risk',
    'risk.level_high': 'High risk',
    'risk.status_high': 'High risk',
    'risk.status_attention': 'Needs attention',
    'risk.status_normal': 'Normal',
    'risk.status_good': 'Good',
    'risk.seek_help_title': 'Please seek professional help immediately',
    'risk.hotline_label': '24-hour psychological helpline',
<<<<<<< HEAD
    'risk.timeline_summary_rising': 'Risk score is trending up recently ({level}, latest {latest}). Please stay aware and keep recording.',
    'risk.timeline_summary_falling': 'Risk score is trending down recently ({level}, latest {latest}). Things are improving.',
    'risk.timeline_summary_stable': 'Risk score has been stable recently ({level}, latest {latest}). No significant fluctuation.',
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'risk.partial_loading_hint': 'Some signal sources are still loading. Showing available data. Click retry for full analysis.',
    'appearance.title': 'Appearance',
    'appearance.subtitle': 'Personalize your visual experience',
    'appearance.accent': 'Accent Color',
    'appearance.accent_desc': 'Affects buttons, links, and emphasis elements',
    'appearance.font_scale': 'Font Scale',
    'appearance.font_scale_desc': 'Adjust global text size',
    'appearance.reduce_motion': 'Reduce Motion',
    'appearance.reduce_motion_desc': 'For users sensitive to motion',
    'appearance.preview': 'Preview',
    'appearance.font_small': 'Small',
    'appearance.font_normal': 'Default',
    'appearance.font_large': 'Large',
    'appearance.font_xlarge': 'X-Large',
    'appearance.color_teal': 'Teal',
    'appearance.color_purple': 'Purple',
    'appearance.color_blue': 'Blue',
    'appearance.color_pink': 'Pink',
    'appearance.color_orange': 'Orange',
    'appearance.color_slate': 'Slate',

    // Settings auto-backup
    'settings.auto_backup': 'Auto Backup Reminder',
    'settings.auto_backup_desc': 'Remind you to back up data periodically to prevent loss',
    'settings.auto_backup_enable': 'Enable backup reminder',
    'settings.backup_interval': 'Interval',
    'settings.last_backup': 'Last backup: ',
    'settings.never': 'never',
    'settings.backup_now': 'Back up now',
    'settings.backing_up': 'Backing up...',

    // Chat
    'chat.history': 'History',
    'chat.no_history': 'No conversation history',
    'chat.no_title': '(untitled)',
    'chat.input_hint': 'Enter to send · Shift+Enter for newline',
    'chat.new_conversation': 'New conversation',
<<<<<<< HEAD
    'chat.today': 'Today',
    'chat.yesterday': 'Yesterday',
    'chat.earlier': 'Earlier',
    'chat.delete_confirm': 'Delete this conversation? This cannot be undone.',

    // Header
    'header.ai_settings': 'AI Settings',
    'header.ai_assistant': 'Zhiyou Assistant',
=======

    // Header
    'header.ai_settings': 'AI Settings',
    'header.ai_assistant': 'AI Assistant',
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
    'header.sidebar_show': 'Show sidebar',
    'header.sidebar_expand': 'Expand sidebar',
    'header.sidebar_collapse': 'Collapse sidebar',

    // Diary
    'diary.date_label': 'Date',

    // Lock screen
    'lock.title': 'App Locked',
    'lock.subtitle': 'Enter your password to unlock',
    'lock.placeholder': 'Enter password',
    'lock.error': 'Incorrect password',
    'lock.unlock': 'Unlock',

    // Error boundary
    'error.title': 'Something went wrong',
    'error.retry': 'Retry',
    'error.retry_failed': 'Multiple retries failed. Please refresh or restart the app.',
<<<<<<< HEAD

    // ── AI Sprint additions (T02/T04/T05) ──────────────────────
    // Chat session
    'chat.session_summary': 'Session Summary',
    'chat.session_topic': 'Topics',
    'chat.session_turns': '{count} turns',
    'chat.emotion_label': 'Emotion',
    'chat.emotion_negative': 'Low',
    'chat.emotion_neutral': 'Calm',
    'chat.emotion_positive': 'Positive',
    'chat.emotion_crisis': 'Crisis',
    'chat.session_empty': 'Start chatting and your current emotion & topics will show here',
    'chat.degraded_path': 'Offline template chat ready (auto-used when no Key / offline)',

    // Diagnostics
    'diag.title': 'System Diagnostics',
    'diag.desc': 'Check network, emotion model, API key and chat fallback path',
    'diag.network': 'Network',
    'diag.online': 'Online',
    'diag.offline': 'Offline',
    'diag.model': 'Emotion Model (ONNX)',
    'diag.model_loaded': 'Loaded',
    'diag.model_ready': 'Available - pending load',
    'diag.model_unavailable': 'Unavailable',
    'diag.model_off': 'Not loaded (keyword fallback)',
    'diag.api_key': 'API Key',
    'diag.key_set': 'Configured',
    'diag.key_missing': 'Missing',
    'diag.degradation': 'Chat Fallback Path',
    'diag.degradation_cloud': 'Cloud chat',
    'diag.degradation_template': 'Offline template chat',
    'diag.app_version': 'Version',
    'diag.demo_mode': 'Demo Mode',
    'diag.demo_on': 'On',
    'diag.demo_off': 'Off',
    'diag.refresh': 'Re-check',
    'diag.refreshing': 'Checking…',
    'diag.ready_template': 'Offline mode - template chat ready',
    'diag.ready_template_enhanced': 'Offline mode - template chat ready (emotion-aware enhancement on)',
    'diag.enter_demo': 'Enter demo mode (inject 30 days of data)',
    'diag.main_process': 'Main process health',
    'diag.main_degraded': 'An internal error occurred: {message} (data stays on this device; restart the app if it persists)',
    'main.degraded_toast': 'An internal error occurred: {message} (data stays on this device; restart the app if it persists)',

    'common.confirm_title': 'Please confirm',
    'common.delete_confirm_title': 'Confirm deletion',

    // Demo mode
    'settings.demo_active': 'Demo mode activated',
    'settings.demo_banner': 'Demo mode · Simulated data',
    'settings.demo_inject': 'Inject 30-day demo data',
    'settings.demo_inject_desc': 'Generate deterministic 30-day simulated data (normal→stress→anxiety→crisis→recovery, with 2 warning events)',
    'settings.demo_clear': 'Clear demo data',
    'settings.demo_clear_confirm': 'Clear demo data? All business data will be wiped (preferences kept).',
    'settings.demo_inject_confirm': 'Current business data will be wiped and 30-day demo data injected. Continue?',
    'settings.demo_data_clear_btn': 'Clear demo data',
    'settings.demo_data_clear_confirm': 'Clear demo data? Business data will be removed (preferences kept) and demo mode will turn off.',
    'settings.demo_data_clear_success': 'Demo data cleared',

    // Evidence chain
    'evidence.title': 'Risk Evidence Chain',
    'evidence.total': 'Total Score',
    'evidence.level': 'Risk Level',
    'evidence.contributions': 'Signal Contributions',
    'evidence.triggers': 'Triggering Evidence',
    'evidence.actions': 'Suggested Actions',
    'evidence.escalation': 'Clinical Escalation',
    'evidence.disclaimer': 'Disclaimer',
    'evidence.method_ref': 'Methodology',
    // Method note dialog (summary + full text)
    'method.title': 'Methodology',
    'method.view_full': 'View full methodology',
    'method.doc_ref': 'Full document',
    'method.disclaimer': 'Statistical prediction ≠ medical diagnosis. This app does not replace professional care.',
    'method.evidence_summary': 'Risk score = weighted sum of 5 signals (emotion / behavior / assessment / chat / diary), 0-100. See full note for weights.',
    'method.prediction_summary': '7-day trend & risk upgrade probability are computed with statistical learning (linear / logistic regression) on recent emotion & behavior data, not neural networks.',
    'method.position_title': 'Positioning',
    'method.position_body': 'FriendOS risk alerting = explainable multi-signal risk assessment (statistical weighting) + statistical early warning (moving average / linear / logistic regression) + ML emotion/crisis recognition (ONNX 4-class).\nThe only real ML (neural network) is emotion/crisis text classification; risk scoring, early warning and trend prediction are explainable statistical methods.',
    'method.boundary_title': 'ML vs Statistical Boundary',
    'method.boundary_body': 'Emotion 4-class (negative/neutral/positive/crisis) = ONNX neural network (real ML).\nCrisis keyword pre-filter = rule table.\nComposite risk score = statistical weighting of 5 signals.\nEarly warning level = moving average + slope.\n7-day prediction + risk upgrade probability = linear + logistic regression (pure JS).\nPersonal baseline = mean ± std.',
    'method.weight_title': 'Risk Score Weights',
    'method.weight_body': 'Emotion 0.30; Behavior 0.25; Assessment (PHQ-9/GAD-7/PSS-10/C-SSRS) 0.25; Chat 0.10; Diary 0.10.\nTotal = Σ(signal × weight), clamped to [0, 100].',
    'method.threshold_title': 'Risk Level Thresholds',
    'method.threshold_body': '0-25 low; 26-50 medium-low; 51-75 medium; 76-90 high; 91-100 critical (clinical escalation).\nThresholds map from PHQ-9 severity grades.',
    'method.trend_title': 'Trend Prediction Method',
    'method.trend_body': 'Based on recent 7-day emotion & behavior series: linear regression for mood trend, logistic regression for risk upgrade probability.\nPredictions are early hints only; combine with composite risk score and clinical scales.',
    'evidence.view': 'View Evidence Chain',
    'evidence.no_data': 'No data',
    'evidence.status_elevated': 'Elevated',
    'evidence.status_normal': 'Normal',
    'evidence.status_no_data': 'No data',
    'evidence.action_diary': 'Write a diary entry for now',
    'evidence.action_breathing': 'Do a breathing exercise',
    'evidence.action_assessment': 'Complete an assessment',
    'evidence.action_hotline': 'Call a psychological hotline',
    'evidence.escalation_true': 'Clinical escalation triggered',
    'evidence.escalation_false': 'No clinical escalation',
    'evidence.disclaimer_text': 'This score is based on statistical rules and ML emotion recognition, and is not a medical diagnosis.',
    'evidence.reason_score_threshold': 'Total score exceeds the 91-point threshold',
    'evidence.reason_cssrs_acute': 'C-SSRS suggests acute risk (intent/plan/behavior)',
    'evidence.reason_multi_channel_crisis': '2+ crisis signal sources (multi-channel crisis convergence)',

    // Privacy panel
    'privacy.title': 'Privacy & Data Security',
    'privacy.desc': 'Learn how your data is protected',
    'privacy.local_only': 'Data stays on this device',
    'privacy.local_only_desc': 'All diaries, assessments and chat data are stored only on your device (IndexedDB). Nothing is uploaded to any server.',
    'privacy.encryption': 'Encryption',
    'privacy.encryption_desc': 'Sensitive fields are encrypted with AES-GCM; the key is derived from your password via PBKDF2 (100k iterations). Keys never cross IPC or logs.',
    'privacy.storage_location': 'Local Storage Location',
    'privacy.storage_location_desc': 'Data lives in the app user-data directory. Open it from Settings → Data Management → "Open Folder".',
    'privacy.no_network': 'No-Network Statement',
    'privacy.no_network_desc': 'Sentiment analysis, risk scoring and prediction all run locally. Only if you voluntarily configure a cloud chat API key are chat messages sent to the cloud provider (proxied by the main process; the renderer never holds the key).',
    'privacy.api_key_secure': 'Encrypted API Key Storage',
    'privacy.api_key_secure_desc': 'API keys are encrypted with OS secure storage (DPAPI / safeStorage) and never written to disk in plaintext.',

    // Onboarding
    'onboarding.skip': 'Skip tour',
    'onboarding.prev': 'Back',
    'onboarding.next': 'Next',
    'onboarding.start': 'Get started',
    'onboarding.step1_title': 'Write a diary',
    'onboarding.step1_desc': 'Spend a few minutes each day writing down your thoughts and feelings. The app gently tracks your emotional changes with no questionnaires required.',
    'onboarding.step1_tip': 'A diary is your way of talking to yourself',
    'onboarding.step2_title': 'Companion, always here',
    'onboarding.step2_desc': 'Chat with ZhiJi for companionship. Works offline too: emotion recognition + multi-turn empathic conversation, caring for you when you feel low.',
    'onboarding.step2_tip': 'Works offline without breaking the demo',
    'onboarding.step3_title': 'Emotion analysis, silently',
    'onboarding.step3_desc': 'Automatically analyzes your mental state from daily writing, chats and task completion, producing emotion trends, health profile and a 7-day outlook.',
    'onboarding.step3_tip': 'Runs silently without disturbing your day',
    'onboarding.step4_title': 'Therapy exercises, self-care',
    'onboarding.step4_desc': 'CBT thought records, breathing exercises, mindfulness and other professional tools to help you manage emotions.',
    'onboarding.step4_tip': 'Crisis intervention appears automatically at high risk',

    // Prediction (P2-2)
    'pred.title': '7-Day Emotion Forecast',
    'pred.risk_upgrade': 'Risk Upgrade Probability',
    'pred.trend': 'Trend',
    'pred.trend_rising': 'Rising',
    'pred.trend_stable': 'Stable',
    'pred.trend_falling': 'Falling',
    'pred.method': 'Method',
    'pred.note': 'Note',
    'pred.disclaimer': 'Statistical prediction ≠ medical diagnosis',
    'pred.stat_note': 'Statistical learning prediction, not a diagnosis. It is based on statistical patterns in historical data (linear/logistic regression) and is for self-observation only.',
    'pred.no_data': 'At least 7 days of data are needed to forecast',
    'pred.confidence': 'Confidence',
    'pred.method_logistic': 'Logistic regression (statistical learning)',
    'pred.method_linear': 'Linear regression (statistical learning)',
    'pred.method_heuristic': 'Heuristic fallback (insufficient samples)',
    'pred.loading': 'Computing forecast…',
    'pred.baseline_compare': 'Personal baseline vs current',
    'pred.baseline': 'Baseline',
    'pred.current': 'Current',
    'pred.forecast': 'Forecast',
    'pred.y_axis': 'Mood score 1-5 (5 = best)',

    // Layout badges
    'nav.demo_mode': 'Demo Mode',
    'nav.privacy': 'Local-first',
    'nav.diagnostics': 'Diagnostics',

    // Emotion page
    'emotion.title': 'Emotion Analysis',
    'emotion.subtitle': 'Gently watching over your mental health',
    'emotion.monitoring': 'Monitoring',
    'emotion.active_days': 'Active Days',
    'emotion.active_days_desc': 'Last 30 days',
    'emotion.index': 'Emotion Index',
    'emotion.records': 'Records',
    'emotion.high_risk': 'High Risk',
    'emotion.trend': 'Emotion Trend',
    'emotion.days': 'd',
    'emotion.health_profile': 'Mental Health Profile',
    'emotion.prediction': 'Emotion Trend Forecast',
    'emotion.insights': 'AI Insights',
    'emotion.suggestions': 'Suggestions',
    'emotion.write_first': 'Write your first diary entry →',
    'emotion.distribution': 'Emotion Distribution',

    // Crisis ethics (P0-7)
    'crisis.hotline_unified_name': 'National Unified Psychological Hotline',
    'crisis.hotline_unified_desc': '24h',
    'crisis.not_medical': 'I cannot replace professional medical care.',
    'crisis.resource_title': 'Intervention Resources',
    'crisis.nearby_hospital': 'Nearby Medical Care',
    'crisis.nearby_hospital_desc': 'If symptoms persist or worsen, please visit the nearest hospital psychiatry / psychology department as soon as possible.',
    'crisis.disclaimer': 'This app provides self-care and companionship tools; it does not constitute medical diagnosis or treatment advice.',

    // Therapy resources
    'therapy.resource_title': 'Intervention Resources',
    'therapy.resource_desc': 'If you or someone around you is experiencing psychological distress, the following resources can help',
    'therapy.hotlines': 'Psychological Hotlines',
    'therapy.nearby_hospital': 'Nearby Medical Care',
    'therapy.nearby_hospital_desc': 'If symptoms persist or worsen, please visit the nearest hospital psychiatry / psychology department as soon as possible',
    'therapy.disclaimer': 'This app provides self-care and companionship tools; it does not constitute medical diagnosis or treatment advice.',

    // Local self-evolution (ZhiJi understanding + feedback touchpoints)
    'selfevo.title': 'How well ZhiJi knows you',
    'selfevo.subtitle': 'Continuously calibrated by your local feedback',
    'selfevo.score': 'Understanding score',
    'selfevo.score_desc': 'Calibration across emotion understanding, risk judgment, and intervention recommendations',
    'selfevo.dim_sentiment': 'Emotion understanding',
    'selfevo.dim_risk': 'Risk judgment',
    'selfevo.dim_intervention': 'Intervention recommendations',
    'selfevo.timeline': 'Self-evolution (30 days)',
    'selfevo.timeline_empty': 'No feedback yet. Tap "Wrong?" when writing a diary to start teaching ZhiJi.',
    'selfevo.calibrated': 'Calibrated with {count} feedbacks',
    'selfevo.sample_insufficient': 'Few samples yet — using the general model',
    'selfevo.confidence_source': 'Confidence source',
    'selfevo.confidence_source_desc': 'On-device local feedback + interpretable statistical calibration (offline, never uploaded)',
    'selfevo.disclaimer': 'Personalization is based on this device only and is not shared across devices; statistical calibration ≠ medical diagnosis.',
    'selfevo.reset': 'Reset personalization',
    'selfevo.reset_desc': 'Clear locally learned parameters and restore the general model',
    'selfevo.reset_success': 'Personalization reset',
    'selfevo.timeline_sentiment': 'Emotion correction',
    'selfevo.timeline_risk': 'Risk calibration',
    'selfevo.timeline_intervention': 'Intervention feedback',
    'selfevo.timeline_forecast': 'Forecast feedback',
    'selfevo.timeline_behavior': 'Behavior insight',
    'selfevo.timeline_early_warning': 'Early warning feedback',
    'selfevo.timeline_other': 'Other feedback',
    'feedback.correct_title': 'Wrong?',
    'feedback.correct_negative': 'Negative',
    'feedback.correct_neutral': 'Neutral',
    'feedback.correct_positive': 'Positive',
    'feedback.correct_crisis': 'Crisis',
    'feedback.risk_over': 'Too high',
    'feedback.risk_just': 'Just right',
    'feedback.risk_under': 'Too low',
    'feedback.intervention_helpful': 'Helpful',
    'feedback.intervention_neutral': 'Neutral',
    'feedback.intervention_not_helpful': 'Not helpful',
    'feedback.thanks': 'Thanks for the feedback',
    'feedback.disabled_crisis': 'Correction is disabled in crisis situations',

    'nav.privacy_policy': 'Privacy Policy',
    'privacy_policy.title': 'Privacy Policy',
    'privacy_policy.updated': 'Last updated: 2026-08-14',
    'privacy_policy.intro': 'ZhiJi FriendOS is a local-first, privacy-first mental health companion app. We know that mental health data is highly sensitive personal information, so "your data never leaves your device" is the first principle of our architecture. Please read this policy before using the app.',
    'privacy_policy.s1_title': 'Scope',
    'privacy_policy.s1_body': 'This policy covers all features of the ZhiJi FriendOS desktop app (Windows / Linux): diary, tasks, habits, memories, AI companion chat, psychological scales, emotion & risk analysis, and LAN sync. The app requires no account registration and collects no identity information such as your name, student ID, or contact details.',
    'privacy_policy.s2_title': 'Data We Collect and Process',
    'privacy_policy.s2_body': 'Content you actively enter: diary text, chat messages, tasks and habits, scale answers, thought records, etc.\nAnalysis results generated locally: sentiment polarity, risk scores, health profile, behavior baselines and other derived data.\nAll of the above is sensitive personal information, generated, stored and processed only on your device. Neither the developers nor any third party can access it.',
    'privacy_policy.s3_title': 'Storage and Encryption',
    'privacy_policy.s3_body': 'All data is stored locally (IndexedDB and local files); nothing is uploaded to any server.\nSensitive fields such as diary content, feedback logs and self-evolution parameters are encrypted with field-level AES-GCM before being written to disk. The encryption key is derived from your app-lock password via PBKDF2 (100,000 iterations), and never enters IPC or logs.\nYou can enable the app lock in Settings for an extra password layer.',
    'privacy_policy.s4_title': 'On-Device AI Analysis',
    'privacy_policy.s4_body': 'Sentiment recognition (ONNX model) and companion chat (local Qwen model) both run inference entirely on your device. No network is required for analysis, and your text is never sent to any model provider.\nAI judgments are for reference only and are not medical diagnoses; methodology documentation for the health profile and risk scoring ships with the app.',
    'privacy_policy.s5_title': 'Optional Cloud LLM',
    'privacy_policy.s5_body': 'Only when you actively configure an API key and select a cloud model is conversation content forwarded through the main process to the provider you chose (e.g. Qwen, DeepSeek) to generate replies.\nThe API key is encrypted with the OS keychain (DPAPI); it never enters the renderer or logs. You can remove the key at any time in Settings. Without a key, the app runs fully offline.',
    'privacy_policy.s6_title': 'LAN Sync',
    'privacy_policy.s6_body': 'The phone-sync feature transfers data peer-to-peer on your local network only after you explicitly start the service and scan the QR code. It uses token authentication and no public server. Stopping the sync service stops all network transfer.',
    'privacy_policy.s7_title': 'Crisis Support and Medical Disclaimer',
    'privacy_policy.s7_body': 'When the app detects crisis signals (e.g. self-harm ideation), it shows a crisis intervention window with national psychological support hotlines (12356, 400-161-9995, etc.) and advice to seek professional help.\nThis app is a companion and self-management tool. It cannot replace diagnosis or treatment by doctors, counselors or professional institutions. If you are in crisis, contact someone you trust or call a professional hotline immediately.',
    'privacy_policy.s8_title': 'Export and Deletion',
    'privacy_policy.s8_body': 'You can export all your data as JSON in Settings → Data Management at any time, or wipe all local data. After uninstalling, remaining local data files can be deleted manually (see the in-app note for the storage directory).',
    'privacy_policy.s9_title': 'Protection of Minors',
    'privacy_policy.s9_body': 'Mental health data is sensitive personal information. If you are under 18, we recommend using the app with the knowledge and company of a parent or guardian, who bears responsibility for supervising minors\' use of online products.',
    'privacy_policy.s10_title': 'Updates and Contact',
    'privacy_policy.s10_body': 'This policy is drafted in accordance with the Personal Information Protection Law of the PRC, the Cybersecurity Law of the PRC, and the Law on the Protection of Minors.\nPolicy updates will be announced in the app release notes; see the date at the top of this page.\nQuestions about this policy can be raised via our GitHub repository (github.com/Fnk000044/FriendOS).',

    'nav.safety_plan': 'Safety Plan',
    'safety_plan.title': 'My Safety Plan',
    'safety_plan.desc': 'Write down a six-step plan for difficult moments while you are calm. It stays on your device, encrypted.',
    'safety_plan.load_fail': 'Failed to load the safety plan',
    'safety_plan.save_fail': 'Failed to save the safety plan',
    'safety_plan.not_created': 'No safety plan yet',
    'safety_plan.not_created_desc': 'Write down your warning signs, coping strategies and support resources while you feel calm. It only takes a few minutes and can be opened instantly in a crisis.',
    'safety_plan.create_btn': 'Create my plan',
    'safety_plan.step1_title': 'My warning signs',
    'safety_plan.step1_ph': 'e.g. trouble sleeping for days, avoiding people, thinking "nothing matters", blaming myself...',
    'safety_plan.step1_hint': 'When these signs appear, it is time to start my safety plan.',
    'safety_plan.step2_title': 'Things I can do by myself',
    'safety_plan.step2_ph': 'e.g. 4-7-8 breathing, a 20-minute walk, my favorite music, journaling...',
    'safety_plan.step2_hint': 'Coping actions I can start immediately, without needing anyone else.',
    'safety_plan.step3_title': 'People and activities that distract me',
    'safety_plan.step3_ph': 'e.g. playing sports with my roommate, going to the library, a club activity, watching a movie...',
    'safety_plan.step3_hint': 'People and things that take me out of painful thoughts.',
    'safety_plan.step4_title': 'People I can trust',
    'safety_plan.step4_ph': 'e.g. Mom 138xxxx, roommate Wang, counselor Li...',
    'safety_plan.step4_hint': 'People I can call or message at critical moments (name + contact).',
    'safety_plan.step5_title': 'Professional resources',
    'safety_plan.step5_ph': 'e.g. campus counseling center, national hotlines 12356 / 400-161-9995, the nearest hospital psychiatry department...',
    'safety_plan.step5_hint': 'Professionals and institutions are always your strongest back-up.',
    'safety_plan.step6_title': 'My reasons to live',
    'safety_plan.step6_ph': 'e.g. my family, dreams not yet realized, my cat, the trip planned for next holiday...',
    'safety_plan.step6_hint': 'Pain passes; these reasons stay.',
    'safety_plan.empty_field': '(not filled in yet)',
    'safety_plan.disclaimer': 'A safety plan is a self-support tool for critical moments and cannot replace professional medical or psychological treatment. If you are in crisis, call 12356 or 400-161-9995 immediately, or reach out to someone you trust.',
    'safety_plan.crisis_title': 'Need help right now?',
    'safety_plan.crisis_desc': 'If you are in intense pain, please reach out to professional support instead of facing it alone. National psychological support hotlines are available 24/7:',
    'safety_plan.edit': 'Edit plan',
    'safety_plan.save': 'Save plan',
    'safety_plan.cancel': 'Cancel',
    'safety_plan.saved': 'Safety plan saved',
    'safety_plan.updated_at': 'Last updated',
    'safety_plan.go_therapy': 'Relaxation exercises',
    'safety_plan.open_from_crisis': 'View my safety plan',

    'report.export_pdf': 'Export PDF',
    'report.export_pdf_success': 'Report exported',
    'report.export_pdf_fail': 'PDF export failed',
    'report.export_pdf_no_data': 'Generate a report first',

    'knowledge.desc': 'Science-based knowledge about common mental health struggles — fully offline, always at hand.',
    'knowledge.search_placeholder': 'Search your question, e.g. exam anxiety, insomnia, social anxiety…',
    'knowledge.all_categories': 'All',
    'knowledge.no_results': 'Nothing found — try different keywords.',
    'knowledge.tips': 'Things you can try',
    'knowledge.hotline_note': 'If you or someone around you is in crisis, seek professional help immediately:',
    'knowledge.disclaimer': 'Educational content is for psychoeducation only and cannot replace diagnosis or treatment by doctors, counselors or professionals.',
    'knowledge.open_safety_plan': 'Create a safety plan for difficult moments',
    'chat.suggest_knowledge': 'Knowledge base',
    'chat.knowledge_hint': 'Want to know more? Read',
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  },
};
