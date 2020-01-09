import time
import json
from datetime import datetime
from flask import Flask, render_template, request, make_response, abort
from flask_cors import CORS
from main_dao import Main_DAO
from Crypto.Util.number import bytes_to_long, long_to_bytes


main_dao = Main_DAO()
app = Flask(__name__)
CORS(app, supports_credentials=True)
app.config['CORS_HEADERS'] = 'Content-Type'

fin = open("data/current_song.txt", "w")
print('', file = fin)
fin.close()


def encode_params(*argvs):
    str_argv = '||'.join([str(argv) for argv in argvs])
    encoded_str = hex(bytes_to_long(str_argv.encode()))[2:].upper()
    return encoded_str


def decode_params(encoded_str):
    str_argvs = long_to_bytes(int(encoded_str, 16)).decode().split("||")
    return str_argvs


def check_login(cookies):
    if 'token' not in cookies:
        return False, {
            "status": "no",
            "alert_message": 'not logined'
        }, None

    token = cookies.get('token')
    if not main_dao.check_token(token):
        return False, {
            "status": "no",
            "alert_message": 'token expired'
        }, None

    return True,  {
        "status": "ok",
        "alert_message": "well done!"
    }, main_dao.get_account_name_by_token(token)

@app.route('/login', methods=['POST'])
def login_granted():
    data = json.loads(request.data)
    account_name = data['username']
    password = data['password']

    if not main_dao.check_password(account_name, password):
        return json.dumps({
            "status": "no",
            "alert_message": "Username not found or password not correct!"
        })

    now_token = main_dao.register_token(account_name)

    reply_data = json.dumps({
        "status": "ok",
        "alert_message": "well done!",
    })

    resp = make_response(reply_data)
    resp.set_cookie("token", now_token)
    return resp


@app.route('/get_user_info', methods=['GET', 'POST'])
def get_user_info():
    if request.method == 'GET':
        is_login, reply, account_name = check_login(request.cookies)
        if not is_login:
            return json.dumps(reply)

        reply['data'] = main_dao.get_user_info(account_name)
        return json.dumps(reply)

    elif request.method == 'POST':
        account_name = request.data.decode()
        return json.dumps(main_dao.get_user_info(account_name))


@app.route('/get_user_wordcloud', methods=['GET'])
def get_user_wordcloud():
    is_login, reply, account_name = check_login(request.cookies)
    if not is_login:
        return json.dumps(reply)

    reply['img_src'] = main_dao.get_wordcloud(account_name)

    return json.dumps(reply)

@app.route('/get_user_room', methods=["GET"])
def get_user_room():
    is_login, reply, account_name = check_login(request.cookies)
    if not is_login:
        return json.dumps(reply)

    reply['room_index'] = main_dao.get_room()

    return json.dumps(reply)


@app.route('/logout', methods=['GET'])
def logout_request():
    token = request.data.decode()
    main_dao.unregister_token(token)

    reply_data = json.dumps({
        "status": "ok",
        "alert_message": "well done!"
    })
    resp = make_response(reply_data)
    resp.delete_cookie('token')

    return resp


@app.route('/get_overall_status', methods=['GET'])
def get_overall_status():
    is_login, reply, account_name = check_login(request.cookies)
    if not is_login:
        return json.dumps(reply)

    all_requests = main_dao.get_requests_list(account_name)
    sent = main_dao.get_sent_or_submitted_list(account_name)
    sent_members = set([info['comment_to'] for info in sent])
    sent = {info['comment_to']: info for info in sent}
    not_send_num = 0
    for single_request in all_requests:
        if single_request['request_from'] not in sent_members or \
                not sent[single_request['request_from']]['has_submitted']:
            not_send_num += 1

    reply['not_send_num'] = not_send_num
    reply['not_read_review'] = not main_dao.is_all_viewed(account_name)

    return json.dumps(reply)


@app.route('/get_post_list', methods=['GET'])
def get_post_list():
    is_login, reply, account_name = check_login(request.cookies)
    if not is_login:
        return json.dumps(reply)

    all_requests = main_dao.get_requests_list(account_name)
    sent = main_dao.get_sent_or_submitted_list(account_name)
    sent_members = set([info['comment_to'] for info in sent])
    sent = {info['comment_to']: info for info in sent}

    def time_to_str(t):
        return datetime.fromtimestamp(t).strftime('%Y/%m/%d %H:%M:%S')

    def get_display_name_by_account_name(account_name):
        return main_dao.get_display_name_by_account_name(
                    account_name)['display_name']

    reply['not_send'] = [{
            'mail': request['request_from'],
            'name': get_display_name_by_account_name(request['request_from']),
            'deadline': time_to_str(request['due_time']),
            'has_sent': request['request_from'] in sent_members,
            '_id': encode_params(request['request_from'], request['due_time'])

        } for request in all_requests if request['request_from'] not in sent_members or not sent[request['request_from']]['has_submitted']
    ]
    reply['sent'] = [{
            'mail': request['request_from'],
            'name': get_display_name_by_account_name(request['request_from']),
            'deadline': time_to_str(request['due_time']),
            'submission_time': time_to_str(sent[request['request_from']]['submission_time']),
            '_id': encode_params(request['request_from'], request['due_time'])

        } for request in all_requests if request['request_from'] in sent_members and sent[request['request_from']]['has_submitted']
    ]
    return json.dumps(reply)


@app.route('/provide', methods=['POST', 'GET'])
def render_doc():
    is_login, reply, comment_from = check_login(request.cookies)
    if not is_login:
        return json.dumps(reply)

    # request_from is equivalent to comment_to.
    request_from, _ = decode_params(request.cookies.get('param'))

    if request.method == 'GET':
        content = main_dao.get_saved_content(comment_from, request_from)
        name_pair = main_dao.get_display_name_by_account_name(request_from)
        reply.update({
            'data': content,
            'name': name_pair['display_name']
        })

        return json.dumps(reply)

    elif request.method == 'POST':
        data = json.loads(request.data)
        content = data['data']
        is_submit = not data['only_save']
        main_dao.submit_or_save_comment(
                comment_from, request_from, content, is_submit)
        reply['alert_message'] = "POST request done successfully.\n"

        return json.dumps(reply)
    abort(404)




def readVolume():
    fin = open("data/volume.txt", "r")
    data = fin.read()[:-1]
    fin.close()

    fin = open("data/volume.txt", "w")
    print('', file=fin)
    fin.close()
    return data
def readStatus():
    fin = open("data/status.txt", "r")
    data = fin.read()[:-1]
    fin.close()

    fin = open("data/status.txt", "w")
    print('', file=fin)
    fin.close()
    return data
def readCurrentSong():
    fin = open("data/current_song.txt", "r")
    data = fin.read()[:-1]
    fin.close()
    return data
def writeCurrentSong(song):
    fin = open("data/current_song.txt", "w")
    print(song, file = fin)
    fin.close()
@app.route('/rpi_query', methods = ['POST'])
def rpi_query():
    # fin = open("data/room.txt", "w")
    # print(f"{str(request.json['room'])}", file=fin)
    main_dao.set_room(request.json['room'])
    song_name = main_dao.get_current_song()
    volume = readVolume()
    status = readStatus()
    return json.dumps({
        'status': 'ok', 
        'data':
            {
                'song_name': song_name, 
                'room': request.json, 
                'volume': volume,
                'status': status
            }})


@app.route('/readCurrentPlay', methods = ['GET'])
def read_current_play():
    return json.dumps({'status': 'ok', 'data': readCurrentSong()})

@app.route('/playListChange', methods = ['POST'])
def play_list_change():
    main_dao.set_current_song(request.json['songName'])
    writeCurrentSong(request.json['songName'])
    return json.dumps({'status': 'ok', 'data': request.json})

@app.route('/volumeChange', methods = ['POST'])
def volume_change():
    fin = open("data/volume.txt", "w")
    print(f"{request.json['volume']}", file=fin)
    return json.dumps({'status': 'ok', 'data': request.json})

@app.route('/statusChange', methods = ['POST'])
def status_change():
    fin = open("data/status.txt", "w")
    print(f"{request.json['status']}", file=fin)
    return json.dumps({'status': 'ok', 'data': request.json})

@app.route('/candidate_and_selected', methods=['GET'])
def candidate_and_selected():
    is_login, reply, account_name = check_login(request.cookies)
    if not is_login:
        return json.dumps(reply)

    candidate = main_dao.get_candidate_list(account_name)
    selected = main_dao.get_selected_list(account_name, is_default=False)
    default = main_dao.get_selected_list(account_name, is_default=True)

    candidate = list(map(main_dao.get_display_name_by_account_name, candidate))
    selected = list(map(main_dao.get_display_name_by_account_name, selected))
    default = list(map(main_dao.get_display_name_by_account_name, default))

    reply['data'] = {
        'candidate': candidate,
        'selected': selected,
        'default': default
    }

    return json.dumps(reply)


@app.route('/update_candidate_and_selected', methods=['POST'])
def update_candidate_and_selected():
    is_login, reply, request_from = check_login(request.cookies)
    if not is_login:
        return json.dumps(reply)

    try:
        data = json.loads(request.data)
        if data['action'] == 'to_right':

            asked_list = data['list']
            for request_to in asked_list:
                main_dao.send_requests(request_from, request_to)

        else:
            # Perserved: provoke invitation.
            pass

    except Exception as e:
        print(e)
        abort(400)

    return json.dumps(reply)


@app.route('/get_review_list', methods=['GET'])
def get_review_list():
    is_login, reply, account_name = check_login(request.cookies)
    if not is_login:
        return json.dumps(reply)

    comments_list = main_dao.get_user_review_list(account_name)

    for comments in comments_list:
        comments["_id"] = encode_params(comments['name'])

    reply['data'] = comments_list

    return json.dumps(reply)

@app.route('/get_song_list', methods=['GET'])
def get_song_list():
    is_login, reply, account_name = check_login(request.cookies)
    if not is_login:
        return json.dumps(reply)

    comments_list = main_dao.get_user_song_list(account_name)

    for comments in comments_list:
        comments["_id"] = encode_params(comments['song_name'])

    reply['data'] = comments_list
    # print(reply)

    return json.dumps(reply)


@app.route('/get_result_list/', methods=['GET'])
def get_result_list():
    is_login, reply, account_name = check_login(request.cookies)
    if not is_login:
        return json.dumps(reply)

    comment_to = decode_params(request.cookies.get('param'))[0]

    data = main_dao.get_user_content_info_list(account_name, comment_to)
    for comment in data:
        comment['_id'] = encode_params(comment['comment_from'], comment_to)
        name_pair = main_dao.get_display_name_by_account_name(
                        comment['comment_from'])
        comment['comment_from_for_display'] = name_pair['display_name']

    name_pair = main_dao.get_display_name_by_account_name(comment_to)
    reply['data'] = data
    reply['account'] = name_pair['account_name']
    reply['display_name'] = name_pair['display_name']

    return json.dumps(reply)


@app.route('/get_review_content/', methods=['GET'])
def get_review_content():
    is_login, reply, account_name = check_login(request.cookies)
    if not is_login:
        return json.dumps(reply)

    comment_from, comment_to = decode_params(request.cookies.get('param'))
    content = main_dao.get_review_content(
                    account_name, comment_from, comment_to)

    comment_from_name_pair = main_dao.get_display_name_by_account_name(
                                comment_from)
    comment_to_name_pair = main_dao.get_display_name_by_account_name(
                                comment_to)

    reply['data'] = content
    reply['comment_from'] = comment_from_name_pair['display_name']
    reply['comment_to'] = comment_to_name_pair['display_name']
    reply['comment_to_id'] = encode_params(comment_to)

    return json.dumps(reply)


@app.route('/bug_report', methods=['POST'])
def bug_report():
    is_login, reply, account_name = check_login(request.cookies)
    if not is_login:
        return json.dumps(reply)

    data = request.data.decode()
    tmp_datetime = datetime.fromtimestamp(time.time())
    date_str = tmp_datetime.strftime('%Y/%m/%d %H:%M:%S')

    fin = open("data/bug_report.txt", "a")
    # print(f"account: {account_name}", file=fin)
    # print(f"time: {date_str}", file=fin)
    # print(f"content: {data}", file=fin)
    # print("=" * 50, file=fin)

    return json.dumps(reply)


@app.route('/architecture', methods=['GET'])
def architecture():
    is_trim = bool(int(request.args.get('trim')))
    _, _, account_name = check_login(request.cookies)

    def get_display_name(account_name):
        name_pair = main_dao.get_display_name_by_account_name(account_name)
        return name_pair['display_name']

    def pact_function(f):
        return list(map(get_display_name, f(account_name)))

    username = get_display_name(account_name)
    links = main_dao.get_all_link()

    slibling = pact_function(main_dao.user_dao.get_siblings)
    sub_tree = pact_function(main_dao.user_dao.get_sub_tree)
    uplinks = pact_function(main_dao.user_dao.get_uplinks)

    related = set(slibling + uplinks + sub_tree + [username])

    filtered_links = []
    for link in links:
        if link['source'] in related and link['target'] in related:
            filtered_links.append(link)

    links = json.dumps(links)
    filtered_links = json.dumps(filtered_links)
    sibling = json.dumps(slibling)
    sub_tree = json.dumps(sub_tree)
    uplinks = json.dumps(uplinks)

    return render_template(
        'architecture_graph.html',
        link=filtered_links if is_trim else links,
        username=username,
        sibling=sibling,
        sub_tree=sub_tree,
        uplinks=uplinks)


@app.route('/mail_reminder', methods=['GET'])
def mail_reminder():
    is_login, reply, account_name = check_login(request.cookies)
    if not is_login:
        return json.dumps(reply)

    return json.dumps(reply)

# @app.after_request
# def af_request(resp):
#     resp = make_response(resp)
#     resp.headers['Access-Control-Allow-Origin'] = 'http://localhost:8787'
#     resp.headers['Access-Control-Allow-Methods'] = 'GET,POST'
#     resp.headers['Access-Control-Allow-Headers'] = 'x-requested-with,content-type'
#     return resp


if __name__ == "__main__":
    app.run(threaded=True)
