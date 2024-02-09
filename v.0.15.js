


$(async function () {
    $('.dashboard--graph').hide()
    


    const getModel = async (estimatedClaims = null, annualPremium = null) => {

        const auth0Client = await auth0.createAuth0Client({
            domain: "login.xn.capital",
            clientId: "NoSXDnJTyhvN9uXGuAbqkCXeEdf15DzV",
            authorizationParams: {
                audience: "https://server.xn.capital"
            },
        });
        const token = await auth0Client.getTokenSilently();
        $.ajax({
            url: 'https://server.xn.capital/api/users/update-model',
            type: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            contentType: 'application/json',
            data: JSON.stringify({
                estimatedClaims: estimatedClaims, // 
                annualPremium: annualPremium
            }),
            success: function (response) {
                const firstSixModels = response.responseData.model.slice(0, 6);
                console.log(firstSixModels); // Optionally log the first 6 models
                window.location.hash = '#graph';
                $('.dashboard--graph--cta').hide()
                $('.dashboard--graph').show()
                initiateGraph(firstSixModels);

                

            },
            error: function (xhr, status, error) {
                console.error('get model failed:', xhr.responseText);
                $('#tab--home').remove()
                $('.dashboard--graph--cta').css('display', 'flex')
                $('.dashboard--graph--wrapper').hide()

            }
        });

    };


    const initiateGraph = async (data) => {



        const getMaxValue = (data) => {
            let maxValues = data.map(element => {
                let annual_premium = element.annual_premium;
                let reinsurance = element.reinsurance
                let estimated_losses = element.estimated_losses
                let admin_fees_and_operational_expenses = element.admin_fees_and_operational_expenses
                let surplus_and_investment_income = element.surplus_and_investment_income;
                return Math.max(annual_premium, reinsurance, estimated_losses, admin_fees_and_operational_expenses, surplus_and_investment_income);
            });
            return Math.max(...maxValues);
        };

        const highestValue = getMaxValue(data);

        function roundUpToFirstDigit(number) {
            var length = Math.ceil(Math.log10(number + 1));
            var multiplier = Math.pow(10, length - 1);

            return Math.ceil(number / multiplier) * multiplier;
        }

        var result = roundUpToFirstDigit(highestValue);
        var baseValue = (result / 1000000).toFixed(1);
        var twoThirdsValue = ((baseValue / 3) * 2).toFixed(1);
        var oneThirdValue = (baseValue / 3).toFixed(1);

        $('.dashboard--graph--label').eq(0).text('$' + baseValue + 'M');
        $('.dashboard--graph--label').eq(1).text('$' + twoThirdsValue + 'M');
        $('.dashboard--graph--label').eq(2).text('$' + oneThirdValue + 'M');
        $('.dashboard--graph--label').eq(4).text('$-' + oneThirdValue + 'M');
        $('.dashboard--graph--label').eq(5).text('$-' + twoThirdsValue + 'M');
        $('.dashboard--graph--label').eq(6).text('$-' + baseValue + 'M');


        function calculateYPixels(xValue, yValue, xPixels) {
            var proportion = yValue / xValue;
            var yPixels = proportion * xPixels;
            return yPixels;
        }


        data.forEach((element, index) => {
            if (index === 6) return;
            let values = []
            let annual_premium = Math.round(element.annual_premium);
            let reinsurance = -Math.round(element.reinsurance);
            let admin_fees_and_operational_expenses = -Math.round(element.admin_fees_and_operational_expenses);
            let estimated_losses = -Math.round(element.estimated_losses);
            let surplus_and_investment_income = Math.round(element.surplus_and_investment_income);
            let cumulative_surplus = (element.cumulative_surplus / 1000000).toFixed(2)
            $('.surplus--text').eq(index).text(`$${cumulative_surplus}M`)

            values = [
                {
                    name: `annual_premium`,
                    value: annual_premium
                },
                {
                    name: `admin_fees_and_operational_expenses`,
                    value: admin_fees_and_operational_expenses
                },
                {
                    name: `reinsurance`,
                    value: reinsurance
                },
                {
                    name: `estimated_losses`,
                    value: estimated_losses
                },
                {
                    name: `surplus_and_investment_income`,
                    value: surplus_and_investment_income
                }
            ]


            $('.dashboard--graph--year').eq(index).text(`${2023 + element.year}`)

            values.forEach((el, i) => {
                let elHeight = Math.abs(el.value)

                elHeight = calculateYPixels(result, elHeight, 300);


                if (el.value > 0) {

                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--block').eq(i).css('height', `${elHeight}`)
                } else {
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--block').eq(i).addClass(`negative`)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--block').eq(i).css('height', `${elHeight}`)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--point').eq(i).css('top', `auto`)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--point').eq(i).css('bottom', `-5px`)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--point').eq(i).css('background-color', `rgba(48, 87, 105, 1)`)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--point').eq(i).css('outline', `8px solid rgba(48, 87, 105, 0.15)`)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--point--text').eq(i).css('background-color', `#E0E6E9`)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--point--text').eq(i).css('color', `#305769`)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--point--label').eq(i).css('top', `330%`)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--point--label').eq(i).css('bottom', `auto`)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--point--deco').eq(i).css('top', `-6px`)
                    $('.dashboard--graph--column').eq(index).find('.dashboard--graph--point--deco').eq(i).css('background-color', `#E0E6E9`)
                }
                $('.dashboard--graph--column').eq(index).find('.dashboard--graph--block').eq(i).addClass(`${el.name}`)
                $('.dashboard--graph--column').eq(index).find('.dashboard--graph--point--text').eq(i).text('$' + el.value.toLocaleString());
            })



        })

        $('.dgraph--index--text').each(function () {
            $(this).data('clicked', false);
        });

        $('.dgraph--index--text').on('click', function () {
            let $this = $(this);
            let id = $this.attr('id');
            $this.data('clicked', !$this.data('clicked'));
            if ($this.data('clicked')) {
                $this.addClass('active');
                activateGraph(id);
                let bgColor = $(`.${$this.attr('id')}`).css('background-color');
                $this.css('background-color', `${bgColor}`)
            } else {
                $this.removeClass('active');
                deactivateGraph(id);
                $this.css('background-color', `#f0f1f3`)
            }
        });

        $('.dgraph--index--text').hover(
            function () {
                let $this = $(this);
                if (!$this.data('clicked')) {
                    $this.addClass('active');
                    activateGraph($this.attr('id'));
                    let bgColor = $(`.${$this.attr('id')}`).css('background-color');
                    $this.css('background-color', `${bgColor}`)
                }
            },
            function () { // Mouse leave
                let $this = $(this);
                if (!$this.data('clicked')) {
                    $this.removeClass('active');
                    deactivateGraph($this.attr('id'));
                    $this.css('background-color', `#f0f1f3`)
                }
            }
        );

        function activateGraph(id) {
            $(`.${id}`).find('.dashboard--graph--point').css('display', 'flex');
            $(`.${id}`).css('z-index', '999');
            if ($(`.${id}`).hasClass('negative')) {
                $(`.${id}`).css('background-color', 'rgba(89, 141, 166, 0.55)');
            } else {
                $(`.${id}`).css('background-color', 'rgba(121, 102, 204, 0.55)');
            }
        }

        function deactivateGraph(id) {
            $(`.${id}`).find('.dashboard--graph--point').css('display', 'none');
            $(`.${id}`).css('z-index', '0');
            if ($(`.${id}`).hasClass('negative')) {
                $(`.${id}`).css('background-color', 'rgba(89, 141, 166, 0.25)');
            } else {
                $(`.${id}`).css('background-color', 'rgba(121, 102, 204, 0.25)');
            }
        }


        $('#annual_premium').trigger('click')
        $('.dashboard--graph--mask').css('display', 'none')
    }

    function formatDollarInput($input) {
        $input.on('input', function () {
            var cursorPos = this.selectionStart;
            var value = $(this).val().replace(/[^0-9.]/g, '');
            var beforeCursor = $(this).val().substr(0, cursorPos);
            var nonNumericBeforeCursor = beforeCursor.replace(/[0-9.]/g, '').length;
            if (value) {
                var formattedValue = parseFloat(value).toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 0,
                    useGrouping: true
                });
                $(this).val('$' + formattedValue);
            } else {
                $(this).val('$');
            }
            var afterCursor = $(this).val().substr(0, cursorPos + 1);
            var nonNumericAfterCursor = afterCursor.replace(/[0-9.]/g, '').length;
            cursorPos += (nonNumericAfterCursor - nonNumericBeforeCursor);
            this.setSelectionRange(cursorPos, cursorPos);
        });
    }


    $('.assumption--input--button').on('click', () => {
        let annualPremium = $('#assumption--input--premium').val()
        let estimatedClaims = $('#assumption--input--claims').val()
        console.log('estimatedClaims', estimatedClaims)
        console.log('annualPremium', annualPremium)
        getModel(estimatedClaims, annualPremium)
        $('.dashboard--graph--mask').css('display', 'flex')
    })

    $('.dollar').each(function () {
        formatDollarInput($(this));
    });


    getModel();
});
