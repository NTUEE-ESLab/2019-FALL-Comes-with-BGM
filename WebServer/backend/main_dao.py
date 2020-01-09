from datetime import datetime
from random import randint

import time
import json

import time
from mutagen.mp3 import MP3
import os

from comment_dao import Comment_DAO
from request_dao import Request_DAO
from user_dao import User_DAO


class Main_DAO:

    def __init__(self):

        self.user_dao = User_DAO()
        self.request_dao = Request_DAO()
        self.comment_dao = Comment_DAO()
        self.token_to_account_name = {}
        self.song_list = []
        self.user_room = None
        self.current_song_name = None

        try:
            self.token_to_account_name = json.load(open("token_storage", "r"))
        except Exception:
            pass

        self.account_wordcloud = {
            'patrickwu2': "https://scontent-hkg3-2.xx.fbcdn.net/v/t31.0-8/29063976_934956576665177_3569118759560767072_o.jpg?_nc_cat=107&_nc_oc=AQn8GG_UpV_aRpu63Gcv0dd1KAl9s_cOayRLjWyHgNCG_j2KzvdUNo1qkaBSDFYJdCQ&_nc_ht=scontent-hkg3-2.xx&oh=b35878e55f5c4027b8be87c1ce018dc4&oe=5DA1C336",
            "joey": "https://www.jiuwa.net/tuku/20190722/uJz3c4yu.gif",
            "cathy": "https://img.purch.com/w/660/aHR0cDovL3d3dy5saXZlc2NpZW5jZS5jb20vaW1hZ2VzL2kvMDAwLzEwNC84MzAvb3JpZ2luYWwvc2h1dHRlcnN0b2NrXzExMTA1NzIxNTkuanBn"
        }

        self.generate_static_info()

    def generate_static_info(self):

        self.read_user_info('data/new_user_info.json')
        self.user_dao.add_default_account('admin', 'admin')
        self.song_list = self.get_request_song('data/songs')

        # Add all account to able_to_submit,
        #       all are able to submit except yourself.
        all_account_list = self.user_dao.get_all_account_list()
        for account_name in all_account_list:

            sub_tree = self.user_dao.get_sub_tree(account_name)
            siblings = self.user_dao.get_siblings(account_name)
            able_to_submit = list(set(sub_tree + siblings))
            self.request_dao.set_able_to_submit(account_name, able_to_submit)

        # throw default request
        for request_from in all_account_list:
            able_to_submit = self.request_dao.get_able_to_submit_list(
                                request_from)
            for request_to in able_to_submit:

                # About 0.33 prob will send a fake request
                if randint(0, 2) != 0:

                    is_dafault = True
                    self.request_dao.send_requests(
                        request_from, request_to, is_dafault,
                        due_time=int(time.time() - randint(-86400*4, 86400)))

    @staticmethod
    def generate_token():
        return ''.join(hex(randint(0, 15))[2:].upper() for i in range(64))

    def generate_test_user(self):
        # Add Know User
        user_list = [
            ['admin', 'admin'],
            ['patrickwu2', '麻神', 'https://bit.ly/2YSuz23'],
            ['joey', '神', 'https://cdn2.ettoday.net/images/1158/1158059.jpg'],
            ['cathy', 'cathy'],
            ['weiting', 'weiting'],
            ['archer', 'archer', 'https://bit.ly/2TApkOz'],
        ]

        # Add Strangers
        for i in range(20):
            user_list.append(['Stranger_' + str(i)]*2)

        for user_info in user_list:
            self.user_dao.add_default_account(*user_info)

    def read_user_info(self, file_name):
        data = json.load(open(file_name, 'r'))
        for user in data:
            self.user_dao.add_account(
                account_name=user['mail'],
                username=user['givenname'],
                display_name=user['displayname'],
                same_account_name=user['samaccountname'],
                password=user['samaccountname'],
                department=user['department'],
                phonenumber=user['telephonenumber'],
                up=user['up']
            )

    def generate_test(self):
        # Generate User
        self.generate_test_user()

        # Add all account to able_to_submit,
        #   all are able to submit except yourself.
        all_account_list = self.user_dao.get_all_account_list()

        for account_name in all_account_list:
            able_to_submit = \
                [name for name in all_account_list if name != account_name]
            self.request_dao.set_able_to_submit(account_name, able_to_submit)

        # throw fake request
        for request_from in all_account_list:
            able_to_submit = self.request_dao.get_able_to_submit_list(
                                request_from)
            for request_to in able_to_submit:

                # About 0.8 prob will send a fake request
                if randint(0, 4) != 0:

                    # About 0.5 will set is_default
                    is_dafault = randint(0, 1) == 0
                    self.request_dao.send_requests(
                        request_from, request_to, is_dafault,
                        due_time=int(time.time() - randint(-86400*4, 86400)))

                    # About 0.5 will send a fake reply
                    if randint(0, 5) == 0:
                        self.comment_dao.submit_or_save_comment(
                            comment_from=request_to,
                            comment_to=request_from,
                            content="",
                            is_submit=True,
                            time=int(time.time() - randint(0, 86400*5))
                        )

    def get_requests_list(self, account_name):
        # needs: request_from / due_data
        all_requests = self.request_dao.get_request_info_by_request_to(
                            account_name)
        filtered_requests = [
            {
                'due_time': request_info['due_time'],
                'request_from': request_info['request_from'],

            } for request_info in all_requests
        ]

        filtered_requests = sorted(
                        filtered_requests, key=lambda x: x['due_time'])
        return filtered_requests

    def get_sent_or_submitted_list(self, account_name):

        all_comment = self.comment_dao.get_comments_by_comment_from(
                        account_name)
        filtered_info = [
            {
                'comment_to': comment_info['comment_to'],
                'submission_time': comment_info['submission_time'],
                'has_submitted': comment_info['has_submitted']

            } for comment_info in all_comment
        ]
        filtered_info = sorted(
                filtered_info, key=lambda x: -x['has_submitted'])
        return filtered_info

    def get_saved_content(self, comment_from, comment_to):
        # TODO: if comment_to not request, return warning

        return self.comment_dao.get_saved_content(comment_from, comment_to)

    def submit_or_save_comment(
            self, comment_from, comment_to, content, is_submit):

        # TODO: if comment_to not request, return warning

        return self.comment_dao.submit_or_save_comment(
                    comment_from, comment_to, content, is_submit)

    def get_candidate_list(self, account_name):
        able_to_submit = self.request_dao.get_able_to_submit_list(account_name)
        all_request_info = self.request_dao.get_request_info_by_request_from(
                                account_name)
        not_submit_yet = able_to_submit[:]

        for request_info in all_request_info:
            del not_submit_yet[
                    not_submit_yet.index(request_info['request_to'])]

        return not_submit_yet

    def get_selected_list(self, account_name, is_default=True):
        all_request_info = self.request_dao.get_request_info_by_request_from(
                            account_name)

        output = []
        for request_info in all_request_info:
            if request_info['is_default'] == is_default:
                output.append(request_info['request_to'])

        return output

    def get_request_song(self, dir='data/songs'):
        info_list = []
        songs = os.listdir(dir)

        for song in songs:
            if song.endswith('.mp3'):
                fn = dir + '/' + song
                print(fn)
                audio = MP3(fn)
                m, s = divmod(audio.info.length, 60)
                h, m = divmod(m, 60)
                m = str(m).split('.')[0]
                s = str(s).split('.')[0]
                if len(s) < 2:
                    s = '0' + s
                time_length = m + ":" + s
                singer, name = song.split('.')[0].split(' ')

                print(singer, name, time_length)

                if name == 'Katrina':
                    info = {
                        'singer': singer,
                        'song_name': name,
                        'length': time_length,
                        'is_playing': False,
                    }
                else:
                    info = {
                        'singer': singer,
                        'song_name': name,
                        'length': time_length,
                        'is_playing': False,
                    }

                info_list.append(info)

        return info_list

    def send_requests(self, request_from, request_to, is_default=False):
        self.request_dao.send_requests(request_from, request_to, is_default)

    def get_user_review_list(self, account_name):
        output_list = []

        sub_tree = self.user_dao.get_sub_tree(account_name)
        for comment_to in sub_tree:

            comments = self.comment_dao.get_comments_by_comment_to(
                            account_name, comment_to)
            already_request_numbers = len(comments)
            all_request_numbers = len(
                self.request_dao.get_request_info_by_request_from(comment_to))
            is_viewed = True

            for comment in comments:
                if not comment['is_viewed']:
                    is_viewed = False

            name_pair = self.get_display_name_by_account_name(comment_to)
            output_list.append({
                'already_request_numbers': already_request_numbers,
                'all_request_numbers': all_request_numbers,
                'name': comment_to,
                'display_name': name_pair['display_name'],
                'is_viewed': is_viewed
            })

        return output_list

    def get_user_song_list(self, account_name):    
        return self.song_list

    def is_all_viewed(self, account_name):
        for review_info in self.get_user_review_list(account_name):
            if not review_info['is_viewed']:
                return False

        return True

    def get_user_content_info_list(self, account_name, comment_to):
        # TODO: ACL setting

        # Submitted
        submitted = self.comment_dao.get_comments_by_comment_to(
                    account_name, comment_to)
        submitted = sorted(submitted, key=lambda x: -x['submission_time'])
        submitted_set = set()

        for comment in submitted:
            tmp_date_time = datetime.fromtimestamp(comment['submission_time'])
            date_str = tmp_date_time.strftime('%Y/%m/%d %H:%M:%S')
            comment['submission_time'] = date_str
            submitted_set.add(comment['comment_from'])

        all_requests = self.request_dao.get_request_info_by_request_from(
                        comment_to)
        all_requests = sorted(all_requests, key=lambda x: -x['due_time'])
        pending = []

        for request in all_requests:
            if request['request_to'] not in submitted_set:

                status = "PENDING"
                if time.time() > request['due_time']:
                    status = "OVERDUE"

                pending.append({
                    'comment_from': request['request_to'],
                    'due_time': request['due_time'],
                    'not_submit_status': status,
                    'is_viewed': True,
                    'has_submitted': False
                })

        return submitted + pending

    def register_token(self, account_name):
        token = self.generate_token()
        while token in self.token_to_account_name:
            token = self.generate_token()

        self.token_to_account_name[token] = account_name
        json.dump(self.token_to_account_name, open("token_storage", "w"))
        return token

    def unregister_token(self, token):
        if token in self.token_to_account_name:
            del self.token_to_account_name[token]

    def check_token(self, token):
        return token in self.token_to_account_name

    def check_password(self, account_name, password):
        return self.user_dao.check_password(account_name, password)

    def get_account_name_by_token(self, token):
        if self.check_token(token):
            return self.token_to_account_name[token]
        else:
            raise 'token not register yet'

    def get_wordcloud(self, account_name):
        if account_name not in self.account_wordcloud:
            return "https://bit.ly/2Twh5TC"
        else:
            return self.account_wordcloud[account_name]
    def set_room(self, room):
        fin = open("data/room.txt", "w")
        print(f"{room}", file=fin)
    def get_room(self):
        fin = open("data/room.txt", "r")
        song_name = fin.read()[:-1]
        return song_name

    def set_current_song(self, song_name):
        fin = open("data/song.txt", "w")
        print(f"{song_name}", file=fin)

    def get_current_song(self):
        fin = open("data/song.txt", "r")
        song_name = fin.read()[:-1]
        fin.close()

        fin = open("data/song.txt", "w")
        print('', file=fin)
        return song_name

    

    def get_user_info(self, account_name):
        return self.user_dao.get_account_info(account_name)

    def get_review_content(self, account_name, comment_from, comment_to):
        return self.comment_dao.get_review_content(
                account_name, comment_from, comment_to)

    def get_display_name_by_account_name(self, account_name):
        account_info = self.user_dao.get_account_info(account_name)
        return {
            'display_name': account_info['display_name'],
            'account_name': account_name
            }

    def get_all_link(self):
        return self.user_dao.get_all_link()


# Test generate testdata
if __name__ == "__main__":
    main_dao = Main_DAO()
    main_dao.generate_test()
    print(main_dao.get_requests_list('admin'))
