import time

import datetime


class Request_DAO:

    def __init__(self):

        ''' request_info_by_request_from : [dict]
               request_from -> requests_list -> request
            request_info_by_request_to : [dict]
               request_to -> requests_list -> request
            ***THIS TWO SHOULD BE INVERSE PAIR***

            request:
                'due_time' : due_time
                'request_from' : account that request from
                'request_to' : account that request to
                'is_default' : if this request is default by

            able_to_submit : [dict]
                request_from -> an account list that request_from can request.
            ***THIS SHOULD BE CONSTANT IF LOADED UP.***
        '''
        self.request_info_by_request_from = {}
        self.request_info_by_request_to = {}
        self.able_to_submit = {}

    def send_requests(
            self, request_from, request_to, is_default=False,
            due_time=int(time.time()) + 86400):

        if request_from not in self.request_info_by_request_from:
            self.request_info_by_request_from[request_from] = []
        if request_to not in self.request_info_by_request_to:
            self.request_info_by_request_to[request_to] = []

        # add comment to comment_info, which fields is described above.
        request_info = {
            'due_time': due_time,
            'request_from': request_from,
            'request_to': request_to,
            'is_default': is_default,
        }

        self.request_info_by_request_from[request_from].append(request_info)
        self.request_info_by_request_to[request_to].append(request_info)

    def set_able_to_submit(self, comment_from, able_list):
        '''Let comment_from able to ask people in able_list some feedback.'''
        self.able_to_submit[comment_from] = able_list

    def get_able_to_submit_list(self, comment_from):
        '''Get the able_list mentioned above.'''
        return self.able_to_submit[comment_from]

    def get_request_info_by_request_to(self, account_name):
        if account_name in self.request_info_by_request_to:
            return self.request_info_by_request_to[account_name]
        else:
            return []

    def get_request_info_by_request_from(self, account_name):
        if account_name in self.request_info_by_request_from:
            return self.request_info_by_request_from[account_name]
        else:
            return []
