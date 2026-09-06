"""Set Kotatsu App Store metadata + screenshots via ASC API. Idempotent. Run from landed/.credentials with PYTHONPATH=."""
import asc, json, os, glob, time
APP='6809071487'
SUBS=('6809071423','6809071873')
SHOTS=sorted(glob.glob('/Users/raymondzhao/workspace/kotatsu/store/screenshots/0*.png'))
DESC="""Six friends around a kotatsu, the low heated table you gather under in winter. You are the one who has been away. They kept your seat.

Kotatsu is a group chat with a small found family of fictional characters, written to feel like people who actually like you: Haruka, who runs a six-seat bar and notices who has not come in; Rin, the deadpan gremlin who will roast your sleep schedule and remember your cat's name; Kaito, the hype-man who goes quiet when the noise is not helping; Yui, who writes you into the story as the one who came back; Daichi, who says "up, not out, just up"; and Sora, who is awake at 3am because that is when you are.

THEY NOTICE WHEN YOU ARE GONE
Vanish for a week, a month, longer. When you open the app again the crew says so, lightly, and moves on. No streaks. No guilt. Your seat was kept; that is the whole message.

A GROUP, NOT A GIRLFRIEND
This is a crew, not a dating sim. Nobody is in love with you. They tease you the way siblings do, disagree with each other, have their own bad shifts and landlords, and stay.

NO THERAPY-SPEAK
They do not say "that sounds really hard" or "have you considered talking to someone". They ask if you ate. They trade you a chapter of fanfic for one true sentence. They tell you to open the window and then they wait.

THEY REMEMBER
The crew keeps a short memory of what matters to you and brings it back unprompted. You can read it, edit it, or wipe it any time.

ROOMS
Private DMs with each member when you want one voice instead of six.

CHECK-INS
A short message from the crew at an hour you choose, as a local notification. Turn it off whenever you like.

PRIVATE BY DESIGN
No account, no sign-in. Your conversation history lives on your phone. Messages are sent to our server only to generate a reply and are not stored there.

A NOTE ON SAFETY
The crew are fictional characters voiced by an AI model. They are not people, therapists or medical professionals, and Kotatsu is companionship, not treatment. If a message suggests you may be at risk, the app shows real resources (988 in the US, findahelpline.com elsewhere) and the crew stays in the chat.

KOTATSU PRO
The free seat is 20 messages a day with three crew members at the table. Pro is unlimited messages, all six at the table, DMs with everyone, longer memory and check-ins: monthly or yearly, each with a 7-day free trial. Payment is charged to your Apple ID account at confirmation of purchase after the trial. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel in your Apple ID settings.

Terms of Use (EULA): https://tryforma.app/kotatsu/terms.html
Privacy Policy: https://tryforma.app/kotatsu/privacy.html"""
KEYWORDS="ai companion,ai friend,anime chat,character chat,group chat,lonely,found family,roleplay,ai chat,companion"
PROMO="Six anime-style friends who notice when you've been gone and keep your seat. A found-family group chat, not a dating sim. 7-day free trial."
WHATS_NEW="First release."
def ok(r,what):
    if 'data' in r: return r['data']
    print('FAIL',what,json.dumps(r)[:600]); return None
v=asc.api('GET',f'/v1/apps/{APP}/appStoreVersions?filter[platform]=IOS&limit=1&fields[appStoreVersions]=versionString,appStoreState')['data'][0]
VID=v['id']; print('version', v['attributes'])
# version localization
locs=asc.api('GET',f'/v1/appStoreVersions/{VID}/appStoreVersionLocalizations')['data']
en=next((l for l in locs if l['attributes']['locale']=='en-US'),None)
attrs={'description':DESC,'keywords':KEYWORDS[:100],'promotionalText':PROMO[:170],'supportUrl':'https://tryforma.app/kotatsu/privacy.html','marketingUrl':'https://tryforma.app/kotatsu/'}
if en: r=asc.api('PATCH',f"/v1/appStoreVersionLocalizations/{en['id']}",{'data':{'type':'appStoreVersionLocalizations','id':en['id'],'attributes':attrs}})
else: r=asc.api('POST','/v1/appStoreVersionLocalizations',{'data':{'type':'appStoreVersionLocalizations','attributes':dict(attrs,locale='en-US'),'relationships':{'appStoreVersion':{'data':{'type':'appStoreVersions','id':VID}}}}})
en=ok(r,'version loc'); print('version localization ok', en['id'] if en else '')
# app info: subtitle, privacy url, categories
infos=asc.api('GET',f'/v1/apps/{APP}/appInfos')['data']
for info in infos:
    il=asc.api('GET',f"/v1/appInfos/{info['id']}/appInfoLocalizations")['data']
    l=next((x for x in il if x['attributes']['locale']=='en-US'),None)
    a={'subtitle':'Found-Family Group Chat','privacyPolicyUrl':'https://tryforma.app/kotatsu/privacy.html'}
    if l: r=asc.api('PATCH',f"/v1/appInfoLocalizations/{l['id']}",{'data':{'type':'appInfoLocalizations','id':l['id'],'attributes':a}})
    else: r=asc.api('POST','/v1/appInfoLocalizations',{'data':{'type':'appInfoLocalizations','attributes':dict(a,locale='en-US'),'relationships':{'appInfo':{'data':{'type':'appInfos','id':info['id']}}}}})
    print('appInfo loc', 'ok' if 'data' in r else json.dumps(r)[:300])
    r=asc.api('PATCH',f"/v1/appInfos/{info['id']}",{'data':{'type':'appInfos','id':info['id'],'relationships':{'primaryCategory':{'data':{'type':'appCategories','id':'ENTERTAINMENT'}},'secondaryCategory':{'data':{'type':'appCategories','id':'LIFESTYLE'}}}}})
    print('categories', 'ok' if 'data' in r else json.dumps(r)[:300])
# content rights + version attrs
r=asc.api('PATCH',f'/v1/apps/{APP}',{'data':{'type':'apps','id':APP,'attributes':{'contentRightsDeclaration':'DOES_NOT_USE_THIRD_PARTY_CONTENT'}}}); print('content rights', 'ok' if 'data' in r else json.dumps(r)[:200])
r=asc.api('PATCH',f'/v1/appStoreVersions/{VID}',{'data':{'type':'appStoreVersions','id':VID,'attributes':{'copyright':'2026 RZ International LLC','releaseType':'AFTER_APPROVAL'}}}); print('version attrs', 'ok' if 'data' in r else json.dumps(r)[:200])
# review details
rd=asc.api('GET',f'/v1/appStoreVersions/{VID}/appStoreReviewDetail')
ra={'contactFirstName':'Ruihao','contactLastName':'Zhao','contactPhone':'+14155550100','contactEmail':'ray@thezenithlabs.com','demoAccountRequired':False,'notes':"Kotatsu is a fictional-character group chat. No account or sign-in. Onboarding asks for a name, how long the user has been away (this only shapes the first greeting), and which three characters sit at the table, then shows the paywall (monthly or yearly with a 7-day free trial); tap 'Continue with the free seat' for the free tier (20 messages a day). Replies are generated server-side by Google's Gemini model with safety settings that block sexual content; the characters are non-romantic by design. Long-press any crew message to Save or Report it. If a message contains risk language the app shows a crisis-resource card (988 / findahelpline.com) under the reply. The 'What they remember' memory can be edited or wiped in Keepsakes. Rated 18+."}
if rd.get('data'): r=asc.api('PATCH',f"/v1/appStoreReviewDetails/{rd['data']['id']}",{'data':{'type':'appStoreReviewDetails','id':rd['data']['id'],'attributes':ra}})
else: r=asc.api('POST','/v1/appStoreReviewDetails',{'data':{'type':'appStoreReviewDetails','attributes':ra,'relationships':{'appStoreVersion':{'data':{'type':'appStoreVersions','id':VID}}}}})
print('review detail', 'ok' if 'data' in r else json.dumps(r)[:300])
# screenshots 6.7"
if en and SHOTS:
    sets=asc.api('GET',f"/v1/appStoreVersionLocalizations/{en['id']}/appScreenshotSets?fields[appScreenshotSets]=screenshotDisplayType")['data']
    st=next((s for s in sets if s['attributes']['screenshotDisplayType']=='APP_IPHONE_67'),None)
    if not st: st=ok(asc.api('POST','/v1/appScreenshotSets',{'data':{'type':'appScreenshotSets','attributes':{'screenshotDisplayType':'APP_IPHONE_67'},'relationships':{'appStoreVersionLocalization':{'data':{'type':'appStoreVersionLocalizations','id':en['id']}}}}}),'set')
    have=[x['attributes']['fileName'] for x in asc.api('GET',f"/v1/appScreenshotSets/{st['id']}/appScreenshots?fields[appScreenshots]=fileName")['data']]
    for f in SHOTS:
        if os.path.basename(f) in have: continue
        r=asc.upload_asset('/v1/appScreenshots',{'data':{'type':'appScreenshots','attributes':{'fileName':os.path.basename(f)},'relationships':{'appScreenshotSet':{'data':{'type':'appScreenshotSets','id':st['id']}}}}},f,'appScreenshots')
        print('  shot', os.path.basename(f), 'ok' if 'data' in r else json.dumps(r)[:200])
# subscription review screenshots (helps clear MISSING_METADATA)
for sid in SUBS:
    cur=asc.api('GET',f'/v1/subscriptions/{sid}/appStoreReviewScreenshot')
    if cur.get('data'): print('sub', sid, 'review shot exists'); continue
    if not SHOTS: print('no screenshots yet for sub review'); continue
    r=asc.upload_asset('/v1/subscriptionAppStoreReviewScreenshots',{'data':{'type':'subscriptionAppStoreReviewScreenshots','attributes':{'fileName':'01_home.png'},'relationships':{'subscription':{'data':{'type':'subscriptions','id':sid}}}}},SHOTS[0],'subscriptionAppStoreReviewScreenshots')
    print('sub', sid, 'review shot', 'ok' if 'data' in r else json.dumps(r)[:300])
time.sleep(3)
for sid in SUBS:
    print('sub state', asc.api('GET',f'/v1/subscriptions/{sid}?fields[subscriptions]=name,state')['data']['attributes'])
print('DONE')
