//
//  GrandAdvisor.swift
//  MoviesApp
//
//  Created by riccardo ruocco on 17/02/22.
//

import Foundation

class GrandAdvisor{
    
    static var shared = GrandAdvisor()
    private init(){
        input = [:]
        numberOfDraws = 0
        isAdvisorSetted = false
        alreadDrawsMovies = [197158,875460]
    }
    
    private var input:[Int64:Double]
    private var numberOfDraws:Int
    var isAdvisorSetted:Bool
    private var alreadDrawsMovies:Array<Int64>
    
    
    func getAdvice()->Int64{
        var recommendedMovie:Int64 = 0
    

        
        if(numberOfDraws<6){
            var input1 = GenresRecommender4Input(items: input, k: 1, restrict_: nil, exclude: alreadDrawsMovies)
            lazy var model1 = GenresRecommender4()
            do {
                let result1 = try model1.prediction(input:input1)
                recommendedMovie = result1.recommendations[0]
                alreadDrawsMovies.append(recommendedMovie)
            }
            catch{

            }
            numberOfDraws+=1
        }
        
        else if(numberOfDraws<8){
            var input2 = KeywordRecommender4Input(items: input, k: 1, restrict_: nil, exclude: alreadDrawsMovies)
            lazy var model2 = KeywordRecommender4()
            do {
                let result2 = try model2.prediction(input:input2)
                recommendedMovie = result2.recommendations[0]
                alreadDrawsMovies.append(recommendedMovie)
            }
            catch{

            }
            numberOfDraws+=1
        }
        
        else if(numberOfDraws<10){
            var input3 = ProductionRecommender4Input(items: input, k: 1, restrict_: nil, exclude: alreadDrawsMovies)
            lazy var model3 = ProductionRecommender4()
            do {
                let result3 = try model3.prediction(input:input3)
                recommendedMovie = result3.recommendations[0]
                alreadDrawsMovies.append(recommendedMovie)
            }
            catch{

            }
            numberOfDraws+=1
        }
        
        if(numberOfDraws == 9){
            numberOfDraws = 0
        }
        return recommendedMovie
    }
    func giveFeedback(drawValueId:Int64,result:Double){
        input[drawValueId] = result
    }
    func setAdvisor(initialValues:[Int64:Double]){
        if(isAdvisorSetted == false){
            input = initialValues
            for (a,b) in initialValues{
                alreadDrawsMovies.append(a)
            }
            isAdvisorSetted = true
        }
        
    }
    func resetAdvisor(){
        input = [:]
        numberOfDraws = 0
        isAdvisorSetted = false
        alreadDrawsMovies = []
        
    }
    
}
