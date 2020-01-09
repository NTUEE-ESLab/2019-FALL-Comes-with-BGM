class User_DAO:

    def __init__(self):
        '''account_info:
            account_name: usally is your email.
            username: usually is your english name.
            display_name: en + (zh) name.
            password: just password. Note that there's no hash function
                involved in test phase.
            same_account_name: the username but with number
            department: the department you belong to,
            img_src: the image show on userinfo,
            phonenumber: Ext. ???,
            up: who is your directed boss? this field name is in
                display_name form
        '''
        self.account_list = []

        # account_info_by_account_name: account_name -> account_info
        self.account_info_by_account_name = {}
        self.account_info_by_same_account_name = {}

    def add_default_account(self, account_name, username, img_src=''):
        ''' Add account only by account_name & username.
        Password is equivalent to account.
        '''

        # add to account list
        self.account_list.append(account_name)

        if img_src is '':
            img_src = "https://cdn2.ettoday.net/images/1158/1158059.jpg"

        # add to account info
        account_info = {
            "account_name": account_name,
            "username": username,
            "display_name": account_name + "(" + username + ")",
            "password": account_name,
            'same_account_name': account_name,
            "department": 'admin department',
            "img_src": img_src,
            'phonenumber': "Unknown",
            "up": "admin"
        }
        self.account_info_by_account_name[account_name] = account_info
        self.account_info_by_same_account_name[account_name] = account_info

    def add_account(
            self, account_name, username, display_name,
            same_account_name, password, department,
            phonenumber, up, img_src=''):

        # add to account list
        self.account_list.append(account_name)

        # add to account info
        account_info = {
            "account_name": account_name,
            "username": username,
            "display_name": display_name,
            'same_account_name': same_account_name,
            "password": password,
            "department": department,
            "img_src": img_src,
            'phonenumber': phonenumber,
            "up": up,
        }
        self.account_info_by_account_name[account_name] = account_info
        self.account_info_by_same_account_name[same_account_name] = \
            account_info

    def get_all_account_list(self):
        return self.account_list

    def get_account_info(self, account_name):
        if account_name in self.account_info_by_account_name:
            user_info = self.account_info_by_account_name[account_name]
            return {
                "email": user_info['account_name'],
                "username": user_info['username'],
                "phonenumber": user_info['phonenumber'],
                "department": user_info['department'],
                "display_name": user_info['display_name'],
                "img_src": user_info["img_src"]
            }

    def check_password(self, account_name, password):
        if account_name in self.account_info_by_account_name:
            user_info = self.account_info_by_account_name[account_name]
            return user_info['password'] == password
        else:
            return False

    def is_subordinate(self, account_name, subordinator):
        '''Check if "subordinator" is account_name's subordinator or not

            Input:
                account_name and subordinator must be mail/account form.

            Output:
                return if is subordinator.
        '''

        target_info = self.account_info_by_account_name[account_name]
        now_info = self.account_info_by_account_name[subordinator]
        target = target_info['same_account_name']
        now = now_info['same_account_name']

        if target == now:
            return False

        while now != 'admin' and now != target:
            next_step = self.account_info_by_same_account_name[now]['up']
            now = next_step
        return now == target

    def get_sub_tree(self, account_name):
        ''' get all of account_name's subordinators' name

            Input:
                account_name

            Output:
                A list contains the all subordinators' account_name
        '''

        return_list = []

        for check_account in self.account_list:
            if self.is_subordinate(account_name, check_account):
                return_list.append(check_account)

        return return_list

    def get_siblings(self, account_name):
        ''' get all of account_name's siblings' name

            *Definition of siblings: the person who has equivalent directed
                supervisor with account_name we called he/she "sibling".*

            Input:
                account_name

            Output:
                A list contains the all subordinators' account_name
        '''

        return_list = []

        up_target = self.account_info_by_account_name[account_name]['up']

        for check_account in self.account_list:
            up_check = self.account_info_by_account_name[check_account]['up']
            if up_target == up_check and account_name != check_account:
                return_list.append(check_account)

        return return_list

    def get_all_link(self):
        ''' get all of relation links

            Output:
                A list contains the all relation links.

            Link format:
                {
                    'source': suborinator's display_name,
                    'target': supervisor's display_name
                }
        '''

        return_list = []

        for account in self.account_list:
            account_info = self.account_info_by_account_name[account]
            target_display_name = account_info['up']
            target_info = self.account_info_by_same_account_name[
                target_display_name]

            return_list.append({
                'source': account_info['display_name'],
                'target': target_info['display_name']
            })

        return return_list

    def get_uplinks(self, account_name):
        ''' get all of relation links

            Output:
                A list contains the all your directed superviors' account name.
        '''

        return_list = []

        now_account_info = self.account_info_by_account_name[account_name]
        now = now_account_info['same_account_name']

        while now != 'admin':
            now_account_info = self.account_info_by_same_account_name[now]
            next_ac = now_account_info['up']
            next_account_info = self.account_info_by_same_account_name[next_ac]
            return_list.append(next_account_info['account_name'])
            now = next_ac

        return return_list
