

//== TODO: Document. ===========================================================

//-- Dependencies --------------------------------
import * as random from '../shared/random.js';

//------------------------------------------------
export default {
    models: {},
    modelWeights: {},
    registerModel(modelType, newClass){
        newClass.prototype.generationType = modelType;
        var generationId = newClass.prototype.generationId;
        var typeModels = this.models[modelType];
        var typeWeights = this.modelWeights[modelType];
        if(!typeModels){
            typeModels = {};
            this.models[modelType] = typeModels;
        }
        if(!typeWeights){
            typeWeights = [];
            this.modelWeights[modelType] = typeWeights;
        }
        var generationWeight = newClass.prototype.generationWeight;
        if(generationWeight){
            var weightClass = typeWeights[generationWeight];
            if(!weightClass){
                weightClass = [];
                typeWeights[generationWeight] = weightClass;
            }
            weightClass.push(generationId);
        }
        if(modelType === 'skill'){
            typeModels[generationId] = new newClass();
            return;
        }
        typeModels[generationId] = newClass;
    },
    getModel(modelType, modelId){
        var typeModels = this.models[modelType];
        if(!typeModels){
            return null;
        }
        var model = typeModels[modelId];
        return model;
    },
    getModelByWeight(modelType, weight){
        weight = Math.round(weight);
        var typeWeights = this.modelWeights[modelType];
        var weightClass;
        var model;
        while(!weightClass && weight > 0){
            weightClass = typeWeights[weight];
            if(!weightClass){
                weight--;
                continue;
            }
            let generationId = random.arrayPick(weightClass);
            model = this.getModel(modelType, generationId);
            if(model){
                break;
            }
        }
        return model;
    }
};
