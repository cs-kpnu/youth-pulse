export interface Survey {
    _id?: string;
    id: number | string;
    title: string;
    organization?: string;
    participants?: number;
    date?: string;
    category?: string;
    ai_description?: string;
    questions?: Question[];
    is_published?: boolean;
}

export interface Question {
    text: string;
    type: string;
    data: any;
    ai_analysis?: string;
}

export interface AnalysisRequest {
    question_text: string;
    data: any;
    data_type: string;
}

export interface UploadResponse {
    temp_id: string;
    filename: string;
    columns: ColumnInfo[];
    suggested_drop: string[];
}

export interface ColumnInfo {
    name: string;
    suggested_type: string;
    example: string;
}
