export interface ILanguageModelFunction {
    name: string;
    description: string;
    parameters?: IParameters;
}

export interface IParameters {
    type: string;
    properties: { [key: string]: IParameterProperty };
    required?: string[];
}

interface IParameterProperty {
    type: string;
    description?: string;
    enum?: string[];
}

export enum EModelDeployment {
    GPT4O = 'gpt-4o',
    GPT35_TURBO = 'gpt-35-turbo-16k',
    GPT4O_MINI = 'gpt-4o-mini',
}
