import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]

results=[]
errors=[]

def check(name, cond, extra=None):
    results.append({'name':name,'ok':bool(cond),'detail':extra if extra is not None else ''})
    print(('PASS ' if cond else 'FAIL ')+name+(' : '+str(extra) if extra else ''))

INJECT = r'''
(() => {
  window.__testUtterances=[];
  window.__spoken=[];
  window.__intervals={};
  const existingSetInterval=window.setInterval.bind(window);
  window.setInterval=(fn,ms,...args)=>{
    if(ms===45000){window.__wallRefresh=fn;return 999;}
    return existingSetInterval(fn,ms,...args);
  };
  class MockUtterance {
    constructor(text){this.text=text;}
  }
  const mock={
    _active:null, getVoices(){return [{name:'Test Chinese',lang:'zh-TW'}]},
    cancel(){
      if(this._active){const old=this._active;this._active=null;old.onerror?.({error:'interrupted'});}
    },
    speak(u){this._active=u; window.__testUtterances.push(u.text);window.__spoken.push(u);queueMicrotask(()=>{if(this._active===u)u.onstart?.()});},
    get speaking(){return Boolean(this._active)}
  };
  Object.defineProperty(window,'speechSynthesis',{configurable:true,value:mock});
  Object.defineProperty(window,'SpeechSynthesisUtterance',{configurable:true,value:MockUtterance});
  window.__finishSpeech=()=>{const active=mock._active;if(active){mock._active=null;active.onend?.();}};
})();
'''

async def load_html(page, kind, seed=None):
    import re
    html=(ROOT / f'{kind}.html').read_text()
    html=re.sub(r'<script[^>]*></script>','',html)
    html=re.sub(r'<link[^>]+rel="stylesheet"[^>]*>','',html)
    await page.set_content(html)
    await page.add_style_tag(content=(ROOT/'assets/style.css').read_text())
    await page.evaluate("""() => {
      const make = () => {const data={};return {getItem:k=>data[k]??null,setItem:(k,v)=>{data[k]=String(v)},removeItem:k=>{delete data[k]}};};
      Object.defineProperty(window,'localStorage',{configurable:true,value:make()});
      Object.defineProperty(window,'sessionStorage',{configurable:true,value:make()});
    }""")
    if seed:
        await page.evaluate('(seed)=>localStorage.setItem("classroom-perspective-local-v1",JSON.stringify(seed))',seed)
    await page.evaluate(INJECT)
    api=(ROOT/'assets/api.js').read_text().replace('export ','')
    js=(ROOT/f'assets/{"app" if kind=="index" else "wall"}.js').read_text()
    import re
    js=re.sub(r'^import .*?;\n','',js,count=1,flags=re.M)
    bundle='window.CLASSROOM_CONFIG={API_URL:""};\n'+api+'\n'+js
    await page.add_script_tag(content=bundle)
    await page.wait_for_timeout(100)

async def open_game(context):
    page=await context.new_page()
    page.on('pageerror',lambda err: errors.append(str(err)))
    await load_html(page,'index')
    await page.fill('#participantName','測試教學者')
    await page.click('#startForm button[type="submit"]')
    return page

async def get_to_role(page, role):
    await page.locator(f'.student-desk[data-student="{role}"]').click()
    await page.wait_for_timeout(110)

async def progress_all(page,role):
    # read: choose support then toggle off; in case of reading optional effects check
    if role=='reading':
        check('閱讀視覺動畫預設關閉',not await page.locator('#readingVisualToggle').is_checked())
        await page.locator('#readingVisualToggle').check()
        check('閱讀動畫可啟用', await page.locator('#stageScene').locator('xpath=..').evaluate('(n)=>n.classList.contains("effect-reading")'))
        await page.locator('#readingVisualToggle').uncheck()
    await page.locator('#supportChoices button').first.click()
    check(f'{role} 教師支持可啟用',await page.locator('#supportChoices button').first.get_attribute('aria-pressed')=='true')
    await page.locator('#supportChoices button').first.click()
    check(f'{role} 教師支持可取消',await page.locator('#supportChoices button').first.get_attribute('aria-pressed')=='false')
    await page.locator('#stagePrimaryBtn').click()
    check(f'{role} 進入畫重點', await page.locator('#workspaceHeading').inner_text()=='請你畫出重點')
    b=page.locator('.sentence-button').nth(0)
    await b.focus(); await b.press('Enter')
    check(f'{role} 畫重點焦點保留',await b.evaluate('(n)=>n===document.activeElement'))
    await page.locator('.sentence-button').nth(1).click()
    await page.locator('#stagePrimaryBtn').click() # check
    await page.locator('#stagePrimaryBtn').click() # next
    check(f'{role} 進入選擇題',await page.locator('#workspaceHeading').inner_text()=='回答課文選擇題')
    radio=page.locator('input[name="classroomQuiz"]').nth(1)
    await radio.focus();await radio.press('ArrowDown')
    check(f'{role} 選擇題焦點保留',await page.evaluate("document.activeElement?.name === 'classroomQuiz'"))
    selected_one=await page.evaluate("document.querySelector('input[name=classroomQuiz]:checked')?.value")
    await page.keyboard.press('ArrowDown')
    selected_two=await page.evaluate("document.querySelector('input[name=classroomQuiz]:checked')?.value")
    check(f'{role} 選擇題方向鍵連續有效',selected_one!=selected_two,(selected_one,selected_two))
    await page.locator('#stagePrimaryBtn').click()
    await page.locator('#stagePrimaryBtn').click()
    check(f'{role} 反思頁可見',await page.locator('#reflectionView').is_visible())

async def main():
    try:
        async with async_playwright() as pw:
            browser=await pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required'])
            context=await browser.new_context(viewport={'width':1365,'height':860})
            # all four roles
            for role in ['vision','hearing','adhd','reading']:
                page=await open_game(context)
                await get_to_role(page,role)
                check(f'{role} 入課後焦點位於標題',await page.evaluate("document.activeElement?.id==='lessonTitle'"))
                check(f'{role} 教室環境音狀態',await page.evaluate("document.getElementById('ambientToggle').getAttribute('aria-pressed')")=='true')
                check(f'{role} 老師語音有啟動',await page.locator('#audioBtn').inner_text()=='■ 停止老師語音')
                if role=='vision':
                    chunks=await page.evaluate('window.__testUtterances.length')
                    check('長篇朗讀已分段',chunks==1,chunks)
                    for i in range(50):
                        await page.evaluate('window.__finishSpeech()')
                        if await page.locator('#audioBtn').inner_text() != '■ 停止老師語音':break
                    total=await page.evaluate('window.__testUtterances.length')
                    check('完整朗讀分成數段',total>=5,total)
                    uttertext=await page.evaluate('window.__testUtterances.join("")')
                    check('五段原文均包含於朗讀',all(q in uttertext for q in ['十一月','農人深切的希望','我拍下一張張照片']))
                    await page.locator('#audioBtn').click()
                    await page.locator('#audioBtn').click() # stop triggers interrupted
                    status=await page.locator('#audioStatus').inner_text()
                    check('停止語音無誤報故障','語音引擎無法發聲' not in status and '已停止' in status,status)
                if role=='hearing':
                    await page.locator('#hearingChoices button').nth(1).focus()
                    await page.locator('#hearingChoices button').nth(1).press('Enter')
                    check('聽障選擇保留焦點',await page.evaluate("document.activeElement?.closest('#hearingChoices')!==null"))
                    check('聽障播放中按鈕不被覆寫',await page.locator('#audioBtn').inner_text()=='■ 停止老師語音')
                await progress_all(page,role)
                await page.close()

            # mobile test for primary functionality
            mobile=await browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
            p=await open_game(mobile)
            await get_to_role(p,'reading')
            check('手機版閱讀視覺選項可見',await p.locator('#readingModePanel').is_visible())
            check('手機版未出現水平溢出',await p.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2'))
            await p.screenshot(path=str(ROOT/'tests/mobile-check.png'),full_page=True)
            await p.close();await mobile.close()

            # wall draft preservation test: create seeded public data in local demo with config turned off
            wall=await context.new_page()
            seed={'posts':[{'id':'local-a','nickname':'測試老師','studentId':'vision','publish':True,'observation':'測試這裡的難點','adjustment':'測試如何調整策略','createdAt':'2026-11-01T13:00:00Z'}],'replies':[]}
            await load_html(wall,'wall',seed)
            cards=await wall.locator('.post-card').count()
            check('交流牆測試資料可顯示',cards>0,cards)
            if cards:
                await wall.locator('.reply-toggle').first.click()
                await wall.locator('.reply-form textarea').first.fill('我還沒送出的很重要的回覆')
                await wall.locator('#wallNickname').fill('測試者')
                await wall.evaluate('window.__wallRefresh?.()')
                await wall.wait_for_timeout(200)
                val=await wall.locator('.reply-form textarea').first.input_value()
                check('交流牆 45 秒刷新不清除草稿',val=='我還沒送出的很重要的回覆',val)
            await wall.close(); await context.close();await browser.close()
    except Exception as e:
        print('TEST EXCEPTION:',str(e))
        raise
    finally:

        out={'checks':len(results),'passed':sum(r['ok'] for r in results),'failed':[r for r in results if not r['ok']],'pageErrors':errors,'results':results}
        (ROOT/'tests/test-results.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
        print('RESULT',out['checks'],out['passed'],'errors',errors[:5])

asyncio.run(main())
