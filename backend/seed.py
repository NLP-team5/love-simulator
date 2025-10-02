import json
import os
from app import app, db, Scenario, Scene, Choice

def seed_data():
    with app.app_context():
        print("🗑️  기존 데이터베이스 초기화 중...")
        db.drop_all()
        db.create_all()
        print("✅ 데이터베이스 초기화 완료!")

        # data 폴더에 있는 모든 .json 파일을 자동으로 찾습니다.
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        PROJECT_ROOT = os.path.dirname(BASE_DIR)
        data_dir = os.path.join(PROJECT_ROOT, 'data')
        
        scenario_files = [f for f in os.listdir(data_dir) if f.endswith('.json')]
        
        for file_name in scenario_files:
            file_path = os.path.join(data_dir, file_name)
            print(f"\n📂 파일 읽는 중: {file_name}")
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                scenario_name = file_name.replace('.json', '')
                
                new_scenario = Scenario(
                    name=scenario_name,
                    title=data.get('scenarioTitle', 'Untitled'),
                    description=data.get('scenarioDescription', ''),
                    difficulty=data.get('difficulty', 2)
                )
                db.session.add(new_scenario)
                print(f"  📝 시나리오 추가: {new_scenario.title}")

                for scene_data in data['scenes']:
                    # --- [수정된 부분 시작] ---
                    new_scene = Scene(
                        sceneId=scene_data['sceneId'],
                        aiLine=scene_data['aiLine'],
                        character_mood=scene_data.get('characterMood'),
                        characterImage=scene_data.get('characterImage'), # <-- 이 줄이 누락되어 있었습니다!
                        scenario=new_scenario
                    )
                    # --- [수정된 부분 끝] ---
                    
                    db.session.add(new_scene)
                    
                    if 'userCards' in scene_data and scene_data['userCards']:
                        for choice_data in scene_data['userCards']:
                            new_choice = Choice(
                                text=choice_data['text'],
                                nextSceneId=choice_data['nextSceneId'],
                                favorability=choice_data['favorability'],
                                scene=new_scene
                            )
                            db.session.add(new_choice)
                
                print(f"  ✅ 장면 및 선택지 추가 완료")
            
            except Exception as e:
                print(f"  ❌ '{file_name}' 처리 중 에러 발생: {e}")

        db.session.commit()
        print("\n🎉 데이터베이스 시드 완료!")

if __name__ == '__main__':
    seed_data()